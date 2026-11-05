const { app } = require("@azure/functions");
const { QueueClient } = require("@azure/storage-queue");

const queueConnection =
  process.env.QUEUE_CONNECTION_STRING || process.env.AzureWebJobsStorage;
const queueName = process.env.QUEUE_NAME;

const getQueueClient = () => {
  if (!queueConnection || !queueName) {
    throw new Error(
      "QUEUE_CONNECTION_STRING (or AzureWebJobsStorage) and QUEUE_NAME are required",
    );
  }
  // FIX: QueueClient has no static fromConnectionString in the JS SDK.
  // The constructor accepts (connectionString, queueName) directly.
  return new QueueClient(queueConnection, queueName);
};

/**
 * Blob subject format:
 * /blobServices/default/containers/{container}/blobs/{blobPath}
 */
const parseSubject = (subject) => {
  const marker = "/containers/";
  const markerIndex = subject.indexOf(marker);
  if (markerIndex === -1) return null;

  const remainder = subject.slice(markerIndex + marker.length);
  const separatorIndex = remainder.indexOf("/blobs/");
  if (separatorIndex === -1) return null;

  return {
    container: decodeURIComponent(remainder.slice(0, separatorIndex)),
    storageKey: decodeURIComponent(
      remainder.slice(separatorIndex + "/blobs/".length),
    ),
  };
};

app.eventGrid("storageUploadTrigger", {
  handler: async (event, context) => {
    context.log("Received event:", JSON.stringify(event));

    if (event.eventType !== "Microsoft.Storage.BlobCreated") {
      return;
    }

    const parsed = parseSubject(event.subject || "");
    if (!parsed) {
      context.log("Unable to parse blob subject, skipping.");
      return;
    }

    const { container, storageKey } = parsed;
    const keyParts = storageKey.split("/");

    if (keyParts.includes("hls")) {
      context.log("HLS segment detected, skipping processing.");
      return;
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
          // The backend may be cold-starting, so allow up to 60 seconds.
          signal: AbortSignal.timeout(60000),
        },
      );

      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      context.log("Backend confirm-upload response:", await response.json());
    } catch (error) {
      context.error("Error calling backend confirm-upload (skipping):", error);
    }

    const isRawLectureVideo =
      keyParts.length >= 6 &&
      keyParts[0] === "root" &&
      keyParts[1] === "courses" &&
      keyParts[3] === "lectures";

    if (!isRawLectureVideo) {
      context.log(
        "Non-video upload (image/avatar) confirmed, no media job dispatched.",
      );
      return;
    }

    const payload = {
      storageKey,
      courseId: keyParts[2],
      lectureId: keyParts[4],
      container,
    };

    context.log("Dispatching media job:", payload);

    try {
      await getQueueClient().sendMessage(JSON.stringify(payload));
      context.log("Queue message sent successfully");
    } catch (error) {
      context.error("Error sending message to the queue (skipping):", error);
    }
  },
});
