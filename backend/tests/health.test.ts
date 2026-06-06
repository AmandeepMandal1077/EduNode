import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health Check Endpoint", () => {
  it("1. should return 200 OK and health status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body.services.server.status).toBe("healthy");
  });
});
