# Deployment Steps

EduNode uses one provider-neutral contract for object storage and one for the
media queue. The provider is selected with environment variables — no code
changes are needed when you move between AWS, Azure and LocalStack.

| Concern | Environment | Provider values |
| --- | --- | --- |
| Object storage | `STORAGE_PROVIDER` | `aws`, `azure`, `localstack` |
| Media queue | `QUEUE_PROVIDER` | `aws`, `azure`, `localstack` |

Shared contracts that must stay identical on every provider:

- Object key layout: `root/courses/{courseId}/lectures/{lectureId}/…` with HLS under `…/hls/`
- Upload expiry: 900 seconds
- Queue message: `{ storageKey, courseId, lectureId, container }`
- Status flow: `PENDING_UPLOAD → UPLOADED → PROCESSING → READY | FAILED | EXPIRED`
- The worker removes the raw video after a successful HLS transcode.

---

# Backend image releases

`.github/workflows/backend-deploy.yml` builds `backend/Dockerfile` on every push
to `main` touching `backend/**` and pushes
`amandeep1077/edunode-backend:<commit-sha>` to Docker Hub. Required repo secrets:
`DOCKER_USERNAME`, `DOCKER_PASSWORD`.

On the server, pull the tag and restart:

```bash
docker pull amandeep1077/edunode-backend:<commit-sha>
docker tag amandeep1077/edunode-backend:<commit-sha> amandeep1077/edunode-backend:1.0  # if compose pins :1.0
docker compose up -d --no-deps backend
```

`backend/.env` stays on the server; it is not baked into the image.

---

# AWS

## 1. Prerequisites

- AWS account with permission to create S3, SQS, Lambda and IAM resources.
- AWS CLI v2 configured (`aws configure`).
- Docker (for building the Lambda zip) or the `zip` CLI.
- Node.js 20 for the trigger package.

Export the values used below:

```bash
export STORAGE_CONTAINER="edunode-media"
export STORAGE_REGION="eu-north-1"
export QUEUE_NAME="edunode-media-queue"
export LAMBDA_NAME="storage-upload-trigger"
export BACKEND_URL="https://api.example.com"
export INTERNAL_API_SECRET="replace-with-a-long-random-secret"
```

## 2. Object storage (S3)

```bash
aws s3 mb "s3://$STORAGE_CONTAINER" --region "$STORAGE_REGION"
```

Enable CORS for direct browser uploads:

```bash
cat > cors.json <<'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.example.com"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
aws s3api put-bucket-cors --bucket "$STORAGE_CONTAINER" --cors-configuration file://cors.json
```

If the browser/player must read objects directly, allow public reads (or put a
CDN in front and set `STORAGE_PUBLIC_BASE_URL` instead):

```bash
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$STORAGE_CONTAINER/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy --bucket "$STORAGE_CONTAINER" --policy file://bucket-policy.json
```

## 3. Media queue (SQS + DLQ)

```bash
aws sqs create-queue --queue-name "${QUEUE_NAME}-dlq" --region "$STORAGE_REGION"

DLQ_URL=$(aws sqs get-queue-url --queue-name "${QUEUE_NAME}-dlq" --region "$STORAGE_REGION" --query QueueUrl --output text)
DLQ_ARN=$(aws sqs get-queue-attributes --queue-url "$DLQ_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

aws sqs create-queue \
  --queue-name "$QUEUE_NAME" \
  --region "$STORAGE_REGION" \
  --attributes "RedrivePolicy={\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"3\"}"

QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$STORAGE_REGION" --query QueueUrl --output text)
```

Recommended queue settings:

- Visibility timeout: `300` seconds (the worker extends it while transcoding).
- Message retention: `1209600` seconds (14 days) if videos can be large.

## 4. IAM

The Lambda role needs:

- `s3:GetObject` on `arn:aws:s3:::$STORAGE_CONTAINER/*` (optional, only if the trigger reads files)
- `sqs:SendMessage` on the media queue ARN
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

The backend and worker credentials need:

- Backend: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket` on the bucket.
- Worker: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the bucket; `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`, `sqs:GetQueueAttributes` on the queue.
- RAG service: `s3:GetObject` on the bucket.

## 5. Trigger (Lambda)

```bash
cd lambda/storage-upload-trigger
npm ci
npm run package
```

Create the function:

```bash
aws lambda create-function \
  --function-name "$LAMBDA_NAME" \
  --runtime nodejs20.x \
  --handler index.handler \
  --role "arn:aws:iam::<account-id>:role/<lambda-role>" \
  --zip-file fileb://package.zip \
  --timeout 30 \
  --environment "Variables={BACKEND_URL=$BACKEND_URL,INTERNAL_API_SECRET=$INTERNAL_API_SECRET,QUEUE_URL=$QUEUE_URL,QUEUE_REGION=$STORAGE_REGION}"
```

Allow S3 to invoke it:

```bash
aws lambda add-permission \
  --function-name "$LAMBDA_NAME" \
  --statement-id s3invoke \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$STORAGE_CONTAINER"
```

Register the bucket notification:

```bash
cat > notification.json <<EOF
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:$STORAGE_REGION:<account-id>:function:$LAMBDA_NAME",
      "Events": ["s3:ObjectCreated:*"]
    }
  ]
}
EOF
aws s3api put-bucket-notification-configuration \
  --bucket "$STORAGE_CONTAINER" \
  --notification-configuration file://notification.json
```

> The trigger skips any key containing an `hls` path segment, so worker output
> does not loop back into transcoding.

## 6. Backend

```env
STORAGE_PROVIDER=aws
STORAGE_CONTAINER=edunode-media
STORAGE_REGION=eu-north-1
STORAGE_ACCESS_KEY=<access-key>
STORAGE_SECRET_KEY=<secret-key>
# Optional CDN / custom domain
# STORAGE_PUBLIC_BASE_URL=https://cdn.example.com

INTERNAL_API_SECRET=<same-value-as-the-trigger>
```

Deploy/restart the backend, then run the storage-key migration once if the
database still contains the legacy `s3Key` field:

```bash
cd backend
bun run migrate:storage-key
```

## 7. Media worker

```env
STORAGE_PROVIDER=aws
STORAGE_CONTAINER=edunode-media
STORAGE_REGION=eu-north-1
STORAGE_ACCESS_KEY=<access-key>
STORAGE_SECRET_KEY=<secret-key>

QUEUE_PROVIDER=aws
QUEUE_URL=<queue-url>
QUEUE_NAME=edunode-media-queue
QUEUE_REGION=eu-north-1

BACKEND_URL=http://<backend-private-ip>:3000
INTERNAL_API_SECRET=<same-value>
RAG_SERVER_URL=http://<rag-private-ip>:8000
```

## 8. RAG service

```env
STORAGE_PROVIDER=aws
STORAGE_CONTAINER=edunode-media
STORAGE_REGION=eu-north-1
STORAGE_ACCESS_KEY=<access-key>
STORAGE_SECRET_KEY=<secret-key>
```

## 9. Verify

1. Request an upload session from the backend and PUT the file to `presignedUrl`.
2. Check the Lambda logs for `Backend confirm-upload response`.
3. Check the worker logs for `PROCESSING` → `READY`.
4. Confirm `master.m3u8` exists under `root/courses/.../hls/` and plays through
   `videoUrl`.

---

# AZURE

## 1. Prerequisites

- Azure subscription with permission to create Storage and Function App resources.
- Azure CLI (`az login`).
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) v4.
- Node.js 20.

```bash
export RESOURCE_GROUP="edunode-rg"
export LOCATION="centralindia"
export STORAGE_ACCOUNT="edunodemedia"
export STORAGE_CONTAINER="edunode-media"
export QUEUE_NAME="edunode-media-queue"
export FUNCTION_APP="edunode-storage-trigger"
export BACKEND_URL="https://api.example.com"
export INTERNAL_API_SECRET="replace-with-a-long-random-secret"
```

## 2. Object storage (Blob Storage)

```bash
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --allow-blob-public-access true

az storage container create \
  --name "$STORAGE_CONTAINER" \
  --account-name "$STORAGE_ACCOUNT" \
  --public-access blob
```

CORS is required because the browser PUTs directly to Blob Storage and the
player fetches HLS playlists/segments:

```bash
az storage cors add \
  --services b \
  --methods GET PUT HEAD \
  --origins "https://app.example.com" \
  --allowed-headers "*" \
  --exposed-headers ETag \
  --max-age 3000 \
  --account-name "$STORAGE_ACCOUNT"
```

> If your organisation disables anonymous blob access, keep the container
> private and set `STORAGE_PUBLIC_BASE_URL` to a CDN/Front Door endpoint that can
> read the container. Uploads still work through SAS URLs.

## 3. Media queue (Storage Queue)

```bash
az storage queue create \
  --name "$QUEUE_NAME" \
  --account-name "$STORAGE_ACCOUNT"
```

Get the connection string:

```bash
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query connectionString \
  --output tsv)
```

## 4. Trigger (Azure Function)

```bash
az functionapp create \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --consumption-plan-location "$LOCATION" \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --storage-account "$STORAGE_ACCOUNT"
```

Configure the function:

```bash
az functionapp config appsettings set \
  --name "$FUNCTION_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    BACKEND_URL="$BACKEND_URL" \
    INTERNAL_API_SECRET="$INTERNAL_API_SECRET" \
    QUEUE_NAME="$QUEUE_NAME" \
    QUEUE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING"
```

Deploy from the function folder:

```bash
cd az-functions/storage-upload-trigger
npm install
func azure functionapp publish "$FUNCTION_APP"
```

The function uses an **Event Grid trigger**. Subscribe it to blob-created
events:

```bash
STORAGE_ID=$(az storage account show \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query id \
  --output tsv)

SUBSCRIPTION_ID=$(az account show --query id --output tsv)
FUNCTION_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FUNCTION_APP/functions/storageUploadTrigger"

az eventgrid event-subscription create \
  --name blob-created \
  --source-resource-id "$STORAGE_ID" \
  --endpoint-type azurefunction \
  --endpoint "$FUNCTION_ID" \
  --included-event-types Microsoft.Storage.BlobCreated \
  --subject-begins-with "/blobServices/default/containers/$STORAGE_CONTAINER/blobs/root/"
```

## 5. Backend

```env
STORAGE_PROVIDER=azure
STORAGE_CONTAINER=edunode-media
STORAGE_CONNECTION_STRING=<connection-string>
# Alternative to a connection string:
# STORAGE_ACCOUNT_NAME=edunodemedia
# STORAGE_ACCOUNT_KEY=<account-key>
# Optional CDN/Front Door base URL
# STORAGE_PUBLIC_BASE_URL=https://cdn.example.com

INTERNAL_API_SECRET=<same-value-as-the-function>
```

The backend returns `uploadHeaders: { "x-ms-blob-type": "BlockBlob" }` for Azure.
The frontend already forwards those headers, so no client change is needed.

Run the storage-key migration once after deploying:

```bash
cd backend
bun run migrate:storage-key
```

## 6. Media worker

```env
STORAGE_PROVIDER=azure
STORAGE_CONTAINER=edunode-media
STORAGE_CONNECTION_STRING=<connection-string>

QUEUE_PROVIDER=azure
QUEUE_CONNECTION_STRING=<connection-string>
QUEUE_NAME=edunode-media-queue

BACKEND_URL=http://<backend-private-ip>:3000
INTERNAL_API_SECRET=<same-value-as-the-function>
RAG_SERVER_URL=http://<rag-private-ip>:8000
```

## 7. RAG service

```env
STORAGE_PROVIDER=azure
STORAGE_CONTAINER=edunode-media
STORAGE_CONNECTION_STRING=<connection-string>
```

## 8. Verify

1. Upload a lecture video from the instructor UI. The browser sends
   `x-ms-blob-type: BlockBlob` automatically.
2. Check the Function App logs for `Dispatching media job`.
3. Check the worker logs for `PROCESSING` → `READY`.
4. Open the resulting `master.m3u8` URL from the lecture record.

Common Azure failures:

- `403` on PUT: storage CORS is missing the frontend origin or
  `x-ms-blob-type` is not allowed.
- `404/403` on playback: the container is private and
  `STORAGE_PUBLIC_BASE_URL` is not configured.
- Function not firing: the Event Grid subscription subject filter does not
  match the container/blob prefix.

---

# LOCALSTACK

LocalStack emulates the AWS control plane in a container. It does **not**
create your resources automatically; the init script in
`localstack/init/01-provision.sh` runs automatically on boot and creates them
(the same actions you would perform in the AWS console).

## 1. Start everything

```bash
docker compose up -d --build
```

`docker-compose.yml` is the local stack and supplies the LocalStack provider
settings (`STORAGE_PROVIDER`, endpoints, bucket, queue, public base, internal
secret). What starts:

- `localstack` on [http://localhost:4566](http://localhost:4566)
- `trigger-builder` (builds the Lambda zip once, then exits)
- `backend`, `frontend`, `rag-service`, `media-worker`, MongoDB, Redis

Compose sets `STORAGE_PROVIDER=localstack` for the backend, worker and RAG
service, and `QUEUE_PROVIDER=localstack` for the worker. Signed upload URLs
use `STORAGE_PRESIGN_ENDPOINT=http://localhost:4566` (the browser cannot resolve
the Docker-only `localstack` host), while server-side calls use
`STORAGE_ENDPOINT=http://localstack:4566`. Playback and image URLs use
`STORAGE_PUBLIC_BASE_URL=http://localhost:4566/edunode-dev-bucket`.

## 2. What the init script creates

| AWS console action | LocalStack init equivalent |
| --- | --- |
| Create bucket | `awslocal s3 mb s3://edunode-dev-bucket` |
| Bucket CORS | `awslocal s3api put-bucket-cors` |
| Public read policy | `awslocal s3api put-bucket-policy` |
| Create SQS queue + DLQ | `awslocal sqs create-queue` + `set-queue-attributes` |
| Create Lambda | `awslocal lambda create-function --zip-file fileb:///opt/trigger/package.zip` |
| Allow S3 to invoke Lambda | `awslocal lambda add-permission` |
| Bucket → Lambda notification | `awslocal s3api put-bucket-notification-configuration` |

LocalStack runs the same `lambda/storage-upload-trigger/index.mjs` used on AWS,
so the confirm-upload + queue dispatch flow is identical.

## 3. Seed the database

Run inside the backend container so it uses the same `INTERNAL_API_SECRET`:

```bash
docker compose exec backend bun run seed.ts
```

Seeded users share the password `Seeded@123`.

## 4. Access

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)
- LocalStack: [http://localhost:4566](http://localhost:4566)
- RAG service: [http://localhost:8000](http://localhost:8000)

Uploaded media is publicly readable at:

```text
http://localhost:4566/edunode-dev-bucket/<storage-key>
```

## 5. Reset local state

```bash
# Stop containers but keep data
docker compose down

# Stop and delete Mongo, Redis, LocalStack, Chroma and trigger build data
docker compose down -v
```

`PERSISTENCE=1` keeps LocalStack resources across restarts. The init script is
idempotent and updates the Lambda code/environment on each boot.

## 6. Notes

- LocalStack Lambda runs in a sibling Docker container. The Compose network is
  named `edunode` and `LAMBDA_DOCKER_NETWORK=edunode` is set so the function can
  reach `http://backend:3000`.
- The Docker socket is mounted so LocalStack can start Lambda containers. If
  your environment forbids that, run the trigger locally instead (not wired by
  default).
- The first `docker compose up` pulls the `public.ecr.aws/lambda/nodejs:20`
  image, so it can take a while.

---

# Switching Providers

Only environment variables change:

| Variable | AWS | Azure | LocalStack |
| --- | --- | --- | --- |
| `STORAGE_PROVIDER` | `aws` | `azure` | `localstack` |
| `STORAGE_CONTAINER` | bucket name | container name | bucket name |
| `STORAGE_REGION` | AWS region | — | `us-east-1` |
| `STORAGE_ENDPOINT` | — | — | `http://localstack:4566` (server) |
| `STORAGE_PRESIGN_ENDPOINT` | — | — | `http://localhost:4566` (browser) |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | AWS keys | — | `test` / `test` |
| `STORAGE_CONNECTION_STRING` | — | Azure connection string | — |
| `STORAGE_PUBLIC_BASE_URL` | CDN (optional) | CDN (optional) | `http://localhost:4566/<bucket>` |
| `QUEUE_PROVIDER` | `aws` | `azure` | `localstack` |
| `QUEUE_URL` | SQS URL | — | `http://localstack:4566/000000000000/edunode-media-queue` |
| `QUEUE_NAME` | queue name | queue name | queue name |
| `QUEUE_CONNECTION_STRING` | — | Azure connection string | — |

Legacy `AWS_*`, `S3_BUCKET_NAME` and `SQS_QUEUE_URL` variables are still read as
fallbacks, so an existing AWS deployment keeps working without edits.

---

# Existing Data Migration

The database field `s3Key` was renamed to `storageKey`. The new backend reads
the legacy field for one release, but new documents are written with
`storageKey`. After deploying, run:

```bash
cd backend
bun run migrate:storage-key
```

The script is idempotent and only touches `lectures` and `mediauploads`.

---

# Troubleshooting

| Symptom | Check |
| --- | --- |
| Upload stuck at `PENDING_UPLOAD` | Trigger logs, bucket notification/Event Grid subscription, `INTERNAL_API_SECRET` parity |
| Upload stuck at `PROCESSING` | Worker logs, queue visibility, `QUEUE_PROVIDER`/`QUEUE_URL` |
| `403` from browser PUT | Storage CORS (AWS/LocalStack/Azure) and Azure `x-ms-blob-type` header |
| Playback fails | Bucket/container public read, `STORAGE_PUBLIC_BASE_URL`, HLS content types |
| LocalStack lost resources | `docker compose down -v` deletes the volume; restart re-runs init |
| Lambda cannot reach backend (LocalStack) | `LAMBDA_DOCKER_NETWORK=edunode` and the Docker socket mount |
