#!/bin/bash
set -euo pipefail

# Runs automatically by LocalStack (ready.d). It replaces the manual AWS
# console/GUI steps: bucket, CORS, public-read policy, SQS + DLQ, IAM role,
# Lambda and the S3 -> Lambda notification.

REGION="${DEFAULT_REGION:-us-east-1}"
CONTAINER="${STORAGE_CONTAINER:-edunode-dev-bucket}"
QUEUE_NAME="${QUEUE_NAME:-edunode-media-queue}"
DLQ_NAME="${QUEUE_NAME}-dlq"
FUNCTION_NAME="edunode-storage-upload-trigger"
ROLE_NAME="edunode-lambda-role"
ZIP_PATH="/opt/trigger/package.zip"
ACCOUNT_ID="000000000000"
INTERNAL_API_SECRET="${INTERNAL_API_SECRET:-local-dev-secret}"

echo "[init] region=${REGION} container=${CONTAINER} queue=${QUEUE_NAME}"

for _ in $(seq 1 30); do
  if [ -f "$ZIP_PATH" ]; then
    break
  fi
  sleep 2
done

if [ ! -f "$ZIP_PATH" ]; then
  echo "[init] ERROR: $ZIP_PATH is missing. Did trigger-builder run?"
  exit 1
fi

# --- Object storage ---------------------------------------------------------
if ! awslocal s3api head-bucket --bucket "$CONTAINER" >/dev/null 2>&1; then
  awslocal s3 mb "s3://$CONTAINER" --region "$REGION"
fi

cat >/tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
awslocal s3api put-bucket-cors --bucket "$CONTAINER" --cors-configuration file:///tmp/cors.json

cat >/tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForLocalMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$CONTAINER/*"
    }
  ]
}
EOF
awslocal s3api put-bucket-policy --bucket "$CONTAINER" --policy file:///tmp/bucket-policy.json

# --- Queue + dead letter queue ---------------------------------------------
if ! awslocal sqs get-queue-url --queue-name "$DLQ_NAME" >/dev/null 2>&1; then
  awslocal sqs create-queue --queue-name "$DLQ_NAME" --region "$REGION"
fi

DLQ_URL=$(awslocal sqs get-queue-url --queue-name "$DLQ_NAME" --query QueueUrl --output text)
DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

if ! awslocal sqs get-queue-url --queue-name "$QUEUE_NAME" >/dev/null 2>&1; then
  awslocal sqs create-queue --queue-name "$QUEUE_NAME" --region "$REGION"
fi

QUEUE_URL=$(awslocal sqs get-queue-url --queue-name "$QUEUE_NAME" --query QueueUrl --output text)
cat >/tmp/redrive.json <<EOF
{
  "QueueUrl": "$QUEUE_URL",
  "Attributes": {
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":\"3\"}"
  }
}
EOF
awslocal sqs set-queue-attributes --cli-input-json file:///tmp/redrive.json

# --- Lambda execution role --------------------------------------------------
if ! awslocal iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  awslocal iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    >/dev/null
fi
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

LAMBDA_ENV="Variables={BACKEND_URL=http://backend:3000,INTERNAL_API_SECRET=$INTERNAL_API_SECRET,QUEUE_URL=http://localstack:4566/$ACCOUNT_ID/$QUEUE_NAME,QUEUE_ENDPOINT=http://localstack:4566,QUEUE_REGION=$REGION,QUEUE_ACCESS_KEY=test,QUEUE_SECRET_KEY=test}"

if ! awslocal lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
  awslocal lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --handler index.handler \
    --role "$ROLE_ARN" \
    --zip-file "fileb://$ZIP_PATH" \
    --timeout 30 \
    --region "$REGION" \
    --environment "$LAMBDA_ENV" \
    >/dev/null
else
  awslocal lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" \
    >/dev/null
  awslocal lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "$LAMBDA_ENV" \
    >/dev/null
fi

awslocal lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id s3invoke \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$CONTAINER" \
  >/dev/null 2>&1 || true

# --- S3 -> Lambda notification ---------------------------------------------
cat >/tmp/notification.json <<EOF
{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME",
      "Events": ["s3:ObjectCreated:*"]
    }
  ]
}
EOF
awslocal s3api put-bucket-notification-configuration \
  --bucket "$CONTAINER" \
  --notification-configuration file:///tmp/notification.json

echo "[init] LocalStack resources are ready."
