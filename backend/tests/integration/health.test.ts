import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";

describe("Health Check Endpoint", () => {
  it("1. GET /health should return 200 OK and healthy server status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.services.server.status).toBe("healthy");
  });
});
