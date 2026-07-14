/**
 * @desc Lambda function triggered by S3 ObjectCreated events to dispatch SQS jobs and confirm upload.
 * @input {Object} event - The S3 event object.
 * @output {Promise<Object>} Status object.
 */
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsConfig = { region: process.env.AWS_REGION };
if (process.env.AWS_ENDPOINT_URL) {
  sqsConfig.endpoint = process.env.AWS_ENDPOINT_URL;
}
const sqsClient = new SQSClient(sqsConfig);

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const bucket = record.s3.bucket.name;

    console.log(`Processing file: ${s3Key} from bucket: ${bucket}`);

    // Structure: root/courses/{courseId}/lectures/{lectureId}/{filename}.mp4
    const keyParts = s3Key.split("/");
    if (
      keyParts.length >= 6 &&
      keyParts[0] === "root" &&
      keyParts[1] === "courses" &&
      keyParts[3] === "lectures" &&
      !keyParts.includes("hls") // Ignore HLS segments uploaded by worker
    ) {

      // Call backend to confirm upload (PENDING_UPLOAD -> UPLOADED)
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/v1/internal/media/confirm-upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET,
          },
          body: JSON.stringify({ s3Key }),
        });

        if (!response.ok) {
          throw new Error(`Backend responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Backend confirm-upload response:", data);
      } catch (error) {
        console.error("Error calling backend confirm-upload:", error);
        throw error; // Lambda retry if backend is down
      }

      const courseId = keyParts[2];
      const lectureId = keyParts[4];

      const payload = {
        s3Key,
        courseId,
        lectureId,
        bucket,
      };

      console.log("Dispatching SQS job for lecture video:", payload);

      const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
      });

      try {
        await sqsClient.send(command);
        console.log("SQS message sent successfully");
      } catch (error) {
        console.error("Error sending message to SQS:", error);
        throw error;
      }
    } else {
      console.log("Not a raw lecture video, skipping SQS dispatch.");
    }
  }

  return { statusCode: 200, body: "Success" };
};
