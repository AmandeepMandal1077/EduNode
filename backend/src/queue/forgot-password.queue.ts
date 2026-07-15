import { Queue, Worker, Job } from "bullmq";
import { QueueKeys } from "./keys.js";
import queueRedis from "./index.js";
import debug from "../utils/debug.js";
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
  debug(`[ForgotPasswordQueue] Reset email sent — job ${job.id}`);
});

forgotPasswordWorker.on("failed", (job, err) => {
  debug(`[ForgotPasswordQueue] Job ${job?.id} failed:`, err.message);
});
