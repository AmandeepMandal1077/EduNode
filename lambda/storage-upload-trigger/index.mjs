import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const queueRegion =
  process.env.QUEUE_REGION || process.env.AWS_REGION || "us-east-1";
const queueEndpoint = process.env.QUEUE_ENDPOINT || undefined;

const sqsClient = new SQSClient({
  region: queueRegion,
  ...(queueEndpoint
    ? {
        endpoint: queueEndpoint,
        credentials: {
          accessKeyId: process.env.QUEUE_ACCESS_KEY || "test",
          secretAccessKey: process.env.QUEUE_SECRET_KEY || "test",
        },
      }
    : {}),
});

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const storageKey = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, " "),
    );
    const container = record.s3.bucket.name;

    console.log(`Processing file: ${storageKey} from container: ${container}`);

    const keyParts = storageKey.split("/");

    if (keyParts.includes("hls")) {
      console.log("HLS segment detected, skipping processing.");
      continue;
    }

    try {
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/v1/internal/media/confirm-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET,
          },
          body: JSON.stringify({ storageKey }),
        },
      );

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Backend confirm-upload response:", data);
    } catch (error) {
      console.error("Error calling backend confirm-upload (skipping):", error);
    }

    const isRawLectureVideo =
      keyParts.length >= 6 &&
      keyParts[0] === "root" &&
      keyParts[1] === "courses" &&
      keyParts[3] === "lectures";

    if (isRawLectureVideo) {
      const payload = {
        storageKey,
        courseId: keyParts[2],
        lectureId: keyParts[4],
        container,
      };

      console.log("Dispatching media job:", payload);

      const command = new SendMessageCommand({
        QueueUrl: process.env.QUEUE_URL || process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
      });

      try {
        await sqsClient.send(command);
        console.log("Queue message sent successfully");
      } catch (error) {
        console.error("Error sending message to the queue (skipping):", error);
      }
    } else {
      console.log(
        "Non-video upload (image/avatar) confirmed, no media job dispatched.",
      );
    }
  }

  return { statusCode: 200, body: "Success" };
};
