import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import * as emailUtils from "../../src/utils/email.js";

describe("Email Send Integration Tests", () => {
  it("1. POST /api/v1/sendEmail should send email and return 200", async () => {
    const spy = vi
      .spyOn(emailUtils, "sendAnnouncementMailToUser")
      .mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/sendEmail")
      .send({
        username: "testuser",
        email: "test@example.com",
        courseName: "Test Course",
        message: "This is an announcement!",
        instructor: "Instructor Name",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Email sent successfully");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("2. POST /api/v1/sendEmail should return 500 on SMTP failure", async () => {
    const spy = vi
      .spyOn(emailUtils, "sendAnnouncementMailToUser")
      .mockRejectedValue(new Error("SMTP down"));

    const response = await request(app)
      .post("/api/v1/sendEmail")
      .send({
        username: "testuser",
        email: "test@example.com",
        courseName: "Test Course",
        message: "This is an announcement!",
        instructor: "Instructor Name",
      });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Failed to send email");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
