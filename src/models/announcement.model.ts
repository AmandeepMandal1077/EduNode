import mongoose, { type HydratedDocument } from "mongoose";
import { Course } from "./course.model.js";
import { ApiError } from "../utils/apiError.js";
import { addAnnouncementJob } from "../queue/announcement.queue.js";

export interface IAnnouncement {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  message: string;
  sentAt: Date;
}

export interface IAnnouncementMethods {
  sendToSubscribedStudents: () => Promise<void>;
}

export interface IAnnouncementVirtuals {}

type TAnnouncementModel = mongoose.Model<
  IAnnouncement,
  {},
  IAnnouncementMethods,
  IAnnouncementVirtuals
>;
export type TAnnouncementDoc = HydratedDocument<
  IAnnouncement,
  IAnnouncementMethods & IAnnouncementVirtuals
>;

const announcementSchema = new mongoose.Schema<
  IAnnouncement,
  TAnnouncementModel,
  IAnnouncementMethods,
  {},
  IAnnouncementVirtuals
>({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: [true, "Course id is needed"],
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  sentAt: {
    type: Date,
    default: Date.now,
    select: false,
  },
});

announcementSchema.index({ courseId: 1 });

announcementSchema.post("save", async function (doc, next) {
  await doc.sendToSubscribedStudents();
  next();
});

announcementSchema.methods.sendToSubscribedStudents = async function () {
  return await addAnnouncementJob(this._id.toString());
};

export const Announcement = mongoose.model<IAnnouncement, TAnnouncementModel>(
  "Announcement",
  announcementSchema,
);
