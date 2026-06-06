import { Queue, Worker, Job } from "bullmq";
import { QueueKeys } from "./keys.js";
import {
  Announcement,
  type IAnnouncement,
} from "../models/announcement.model.js";
import queueRedis from "./index.js";
import { sendAnnouncementMailToUser } from "../utils/email.js";

export type TEmailQueueJobData = {
  username: string;
  email: string;
  courseName: string;
  message: string;
  instructor: string;
};

const emailQueue = new Queue(QueueKeys.EMAIL, {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const addEmailJobBulk = async (data: TEmailQueueJobData[]) => {
  await emailQueue.addBulk(
    data.map((job) => ({
      name: QueueKeys.SEND_EMAIL,
      data: job,
    })),
  );
};

const emailWorker = new Worker(
  QueueKeys.EMAIL,
  async (job: Job<TEmailQueueJobData>) => {
    const jobData = job.data as TEmailQueueJobData;
    const { username, email, courseName, message, instructor } = jobData;

    await sendAnnouncementMailToUser({
      username,
      email,
      courseName,
      message,
      instructor,
    });
  },
  {
    connection: queueRedis,
  },
);
