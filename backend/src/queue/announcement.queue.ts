import { Queue, Worker } from "bullmq";
import { QueueKeys } from "./keys.js";
import {
  Announcement,
  type IAnnouncement,
} from "../models/announcement.model.js";
import queueRedis from "./index.js";
import { addEmailJobBulk } from "./email.queue.js";
import { Course } from "../models/course.model.js";
import type { IUser } from "../models/user.model.js";

const announcementQueue = new Queue(QueueKeys.ANNOUNCEMENT, {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const addAnnouncementJob = async (announcementId: string) => {
  const announcement = await Announcement.findById(announcementId);
  const courseDetails = await Course.findById(announcement!.courseId)
    .select("instructor enrolledStudents title")
    .populate({
      path: "instructor",
      select: "name",
    })
    .populate({
      path: "enrolledStudents.student",
      select: "email name",
    });

  const subscribedStudents = courseDetails!.enrolledStudents;
  const data = subscribedStudents.map((student) => {
    const studentDetails = student.student as unknown as IUser;
    return {
      username: studentDetails.name,
      email: studentDetails.email,
      courseName: courseDetails!.title,
      message: announcement!.message,
      instructor: (courseDetails!.instructor as unknown as IUser).name,
    };
  });

  await announcementQueue.add(QueueKeys.SEND_ANNOUNCEMENT, data);
};

const announcementWorker = new Worker(
  QueueKeys.ANNOUNCEMENT,
  async (job) => {
    await addEmailJobBulk(job.data);
  },
  {
    connection: queueRedis,
  },
);
