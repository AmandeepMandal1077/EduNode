import mongoose, { Types } from "mongoose";

export interface IChatMessage {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lectureId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
}

const chatMessageSchema = new mongoose.Schema<IChatMessage>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: [true, "Lecture reference is required"],
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: [true, "Role is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
  },
  {
    timestamps: true,
  },
);

chatMessageSchema.index({ userId: 1, courseId: 1, lectureId: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
