import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const s3Key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const bucket = record.s3.bucket.name;

    console.log(`Processing file: ${s3Key} from bucket: ${bucket}`);

    const keyParts = s3Key.split("/");

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
          body: JSON.stringify({ s3Key }),
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
        s3Key,
        courseId: keyParts[2],
        lectureId: keyParts[4],
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
        console.error("Error sending message to SQS (skipping):", error);
      }
    } else {
      console.log(
        "Non-video upload (image/avatar) confirmed, no SQS dispatch.",
      );
    }
  }

  return { statusCode: 200, body: "Success" };
};
