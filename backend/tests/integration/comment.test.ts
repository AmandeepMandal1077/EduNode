import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { User, Role } from "../../src/models/user.model.js";
import { Course, CourseLevel } from "../../src/models/course.model.js";
import { Lecture } from "../../src/models/lecture.model.js";
import { Comment, CommentLike, CommentDislike } from "../../src/models/comment.model.js";
import { loginUser } from "../setup.js";
import mongoose from "mongoose";

describe("Comment Controller Integration Tests", () => {
  const authorUser = {
    name: "Author User",
    email: "author@example.com",
    password: "Password123!",
    role: Role.STUDENT,
  };

  const otherUser = {
    name: "Other User",
    email: "other@example.com",
    password: "Password123!",
    role: Role.STUDENT,
  };

  let authorToken: string;
  let otherToken: string;
  let authorId: string;
  let lectureId: string;

  beforeEach(async () => {
    const authUser = await User.create(authorUser);
    authorId = authUser._id.toString();
    await User.create(otherUser);

    authorToken = await loginUser(app, authorUser.email, authorUser.password);
    otherToken = await loginUser(app, otherUser.email, otherUser.password);

    const course = await Course.create({
      title: "Comment Course",
      subtitle: "Sub",
      description: "Desc",
      category: "Tech",
      level: CourseLevel.BEGINNER,
      price: 0,
      instructor: new mongoose.Types.ObjectId(),
      thumbnail: "http://example.com/thumbnail.png",
    });

    const lecture = await Lecture.create({
      title: "Comment Lecture",
      description: "Desc",
      videoUrl: "https://example.com/v.mp4",
      courseId: course._id,
      s3Key: "comment/lecture/key.mp4",
      uploadSessionId: "comment-upload-session-id",
    });
    lectureId = lecture._id.toString();
  });

  it("1. POST /api/v1/comment should create comment successfully", async () => {
    const response = await request(app)
      .post("/api/v1/comment")
      .set("Cookie", [authorToken])
      .send({
        lectureId,
        content: "This is a great lecture!",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.comment.content).toBe("This is a great lecture!");
    expect(response.body.data.comment.userId).toBe(authorId);
  });

  it("2. POST /api/v1/comment with missing content should return 400", async () => {
    const response = await request(app)
      .post("/api/v1/comment")
      .set("Cookie", [authorToken])
      .send({
        lectureId,
        content: "",
      });

    expect(response.status).toBe(400);
  });

  it("3. POST /api/v1/comment/like should toggle like on/off", async () => {
    const comment = await Comment.create({
      lectureId: new mongoose.Types.ObjectId(lectureId),
      userId: new mongoose.Types.ObjectId(authorId),
      content: "Like me!",
    });

    // 1st like (on)
    let response = await request(app)
      .post("/api/v1/comment/like")
      .set("Cookie", [authorToken])
      .send({
        lectureId,
        commentId: comment._id.toString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.data.comment.likes).toBe(1);

    // 2nd like (off)
    response = await request(app)
      .post("/api/v1/comment/like")
      .set("Cookie", [authorToken])
      .send({
        lectureId,
        commentId: comment._id.toString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.data.comment.likes).toBe(0);
  });

  it("4. POST /api/v1/comment/like should remove existing dislike and add like", async () => {
    const comment = await Comment.create({
      lectureId: new mongoose.Types.ObjectId(lectureId),
      userId: new mongoose.Types.ObjectId(authorId),
      content: "Disliked to liked",
      dislikes: 1,
    });

    // Seed dislike in DB
    await CommentDislike.create({
      commentId: comment._id,
      userId: new mongoose.Types.ObjectId(authorId),
    });

    const response = await request(app)
      .post("/api/v1/comment/like")
      .set("Cookie", [authorToken])
      .send({
        lectureId,
        commentId: comment._id.toString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.data.comment.likes).toBe(1);
    expect(response.body.data.comment.dislikes).toBe(0);
  });

  it("5. DELETE /api/v1/comment by non-author should return 403", async () => {
    const comment = await Comment.create({
      lectureId: new mongoose.Types.ObjectId(lectureId),
      userId: new mongoose.Types.ObjectId(authorId),
      content: "Do not delete",
    });

    const response = await request(app)
      .delete("/api/v1/comment")
      .set("Cookie", [otherToken])
      .send({
        lectureId,
        commentId: comment._id.toString(),
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You can only delete your own comments");
  });
});
