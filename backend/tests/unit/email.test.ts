import { describe, it, expect, vi } from "vitest";
import { sendEmailController } from "../../src/controllers/email.controller.js";
import * as emailUtils from "../../src/utils/email.js";

describe("Email Controller Unit Tests", () => {
  it("1. sendEmailController should return 200 on success", async () => {
    const spy = vi
      .spyOn(emailUtils, "sendAnnouncementMailToUser")
      .mockResolvedValue(undefined);

    const req = {
      body: {
        username: "testuser",
        email: "test@example.com",
      },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await sendEmailController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Email sent successfully",
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("2. sendEmailController should return 500 when sending fails", async () => {
    const spy = vi
      .spyOn(emailUtils, "sendAnnouncementMailToUser")
      .mockRejectedValue(new Error("SMTP failure"));

    const req = {
      body: {
        username: "testuser",
        email: "test@example.com",
      },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await sendEmailController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to send email",
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
