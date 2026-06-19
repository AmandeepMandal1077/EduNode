import { Job, Queue, Worker } from "bullmq"
import { QueueKeys } from "./keys.js"
import queueRedis from "./index.js"

interface ILectureUploadQueue {
    lectureId: string,
    courseId: string,
    lectureUrl: string,
}

const lectureUploadQueue = new Queue(QueueKeys.LECTURE_UPLOAD_QUEUE, {
    connection: queueRedis,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});

export const addLectureUploadJob = async (data: ILectureUploadQueue) => {
    await lectureUploadQueue.add(QueueKeys.SEND_LECTURE_UPLOAD_QUEUE, data);
};

const lectureUploadWorker = new Worker(
    QueueKeys.LECTURE_UPLOAD_QUEUE,
    async (job: Job<ILectureUploadQueue>) => {
        const payload = {
            resource_url: job.data.lectureUrl,
            lecture_id: job.data.lectureId,
            course_id: job.data.courseId,
        }
        console.log("Sending to server")
        const ragServerUrl = process.env.RAG_SERVER_URL || "http://host.docker.internal:8000";
        const response = await fetch(`${ragServerUrl}/ingest`,
            {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json"
                }
            }
        )

        console.log("received response");

        if (!response.ok) {
            throw new Error(
                `Python server returned ${response.status}`
            );
        }
    },
    {
        connection: queueRedis
    }
)


lectureUploadWorker.on("completed", (job) => {
    console.log(`[LectureUploadQueue] Lecture uploaded — job ${job.id}`);
});

lectureUploadWorker.on("failed", (job, err) => {
    console.error(`[LectureUploadQueue] Job ${job?.id} failed:`, err.message);
});