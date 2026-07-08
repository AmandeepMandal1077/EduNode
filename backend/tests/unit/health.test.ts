import { describe, it, expect, vi } from "vitest";
import { healthCheck } from "../../src/controllers/health.controller.js";
import * as dbConnectionModule from "../../src/database/db.js";

describe("Health Controller Unit Tests", () => {
  it("1. healthCheck should return 200 and healthy status when database is connected", async () => {
    const statusSpy = vi.spyOn(dbConnectionModule, "connectionStatus").mockReturnValue({
      isConnected: true,
      readyState: 1,
      host: "localhost",
      name: "lms",
    });

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await healthCheck(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.status).toBe("OK");
    expect(responseData.services.database.status).toBe("healthy");

    statusSpy.mockRestore();
  });

  it("2. healthCheck should return Failed status when database is disconnected", async () => {
    const statusSpy = vi.spyOn(dbConnectionModule, "connectionStatus").mockReturnValue({
      isConnected: false,
      readyState: 0,
      host: "localhost",
      name: "lms",
    });

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await healthCheck(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.services.database.status).toBe("Failed");

    statusSpy.mockRestore();
  });

  it("3. healthCheck should include uptime and memory metrics", async () => {
    const statusSpy = vi.spyOn(dbConnectionModule, "connectionStatus").mockReturnValue({
      isConnected: true,
      readyState: 1,
      host: "localhost",
      name: "lms",
    });

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    await healthCheck(req, res, next);

    const responseData = res.json.mock.calls[0][0];
    expect(responseData.services.server.uptime).toBeTypeOf("number");
    expect(responseData.services.server.memeoryUsage).toBeTypeOf("object");

    statusSpy.mockRestore();
  });
});
