#!/bin/bash
echo "Initializing LocalStack AWS resources..."

# Create S3 bucket
awslocal s3 mb s3://edunode-local

# Configure CORS
awslocal s3api put-bucket-cors \
  --bucket edunode-local \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }]
  }'

# Create SQS Queue
awslocal sqs create-queue --queue-name edunode-media-queue

# Zip Lambda function
echo "Zipping Lambda function..."
cd /var/task/lambda/s3-upload-trigger
npm install
zip -q -r /tmp/s3-trigger.zip .

# Create Lambda Function
awslocal lambda create-function \
  --function-name s3-upload-trigger \
  --runtime nodejs18.x \
  --handler index.handler \
  --zip-file fileb:///tmp/s3-trigger.zip \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --environment Variables="{BACKEND_URL=http://backend:3000,INTERNAL_API_SECRET=local-dev-secret,SQS_QUEUE_URL=http://localstack:4566/000000000000/edunode-media-queue,AWS_ENDPOINT_URL=http://localstack:4566}"

# Wait for Lambda to be active
awslocal lambda wait function-active-v2 --function-name s3-upload-trigger

# Add S3 Event Notification to trigger Lambda
awslocal s3api put-bucket-notification-configuration \
  --bucket edunode-local \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "arn:aws:lambda:us-east-1:000000000000:function:s3-upload-trigger",
        "Events": ["s3:ObjectCreated:*"]
      }
    ]
  }'

echo "LocalStack AWS resources initialized successfully!"
