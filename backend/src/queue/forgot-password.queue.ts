import { Queue, Worker, Job } from "bullmq";
import { QueueKeys } from "./keys.js";
import queueRedis from "./index.js";
import {
  sendPasswordResetEmail,
  type TPasswordResetEmailData,
} from "../utils/email.js";

const forgotPasswordQueue = new Queue(QueueKeys.FORGOT_PASSWORD, {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const addForgotPasswordJob = async (data: TPasswordResetEmailData) => {
  await forgotPasswordQueue.add(QueueKeys.SEND_FORGOT_PASSWORD, data);
};

const forgotPasswordWorker = new Worker(
  QueueKeys.FORGOT_PASSWORD,
  async (job: Job<TPasswordResetEmailData>) => {
    await sendPasswordResetEmail(job.data);
  },
  {
    connection: queueRedis,
  },
);

forgotPasswordWorker.on("completed", (job) => {
});

forgotPasswordWorker.on("failed", (job, err) => {
  console.error(`[ForgotPasswordQueue] Job ${job?.id} failed:`, err.message);
});
