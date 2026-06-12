import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import * as emailUtils from "../src/utils/email.js";

describe("Email Routes", () => {
    it("should return 200 on successful email send", async () => {
        const spy = vi.spyOn(emailUtils, "sendAnnouncementMailToUser").mockResolvedValue(undefined);

        const res = await request(app).post("/api/v1/emails").send({
            to: "test@example.com",
            subject: "Test Subject",
            text: "Test Body"
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("should return 500 on failure to send", async () => {
        const spy = vi.spyOn(emailUtils, "sendAnnouncementMailToUser").mockRejectedValue(new Error("SMTP error"));

        const res = await request(app).post("/api/v1/emails").send({
            to: "test@example.com",
            subject: "Test Subject",
            text: "Test Body"
        });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        spy.mockRestore();
    });
});
