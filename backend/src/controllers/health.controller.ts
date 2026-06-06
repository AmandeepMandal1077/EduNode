import { asyncHandler } from "../utils/asynchandler.js";
import { connectionStatus } from "../database/db.js";

import { type Request, type Response } from "express";

const healthCheck = asyncHandler(async (_: Request, res: Response) => {
  const dbStatus = connectionStatus();

  const healthStatus = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus.isConnected ? "healthy" : "Failed",
        details: {
          ...dbStatus,
          readyState: dbStatus.readyState,
        },
      },
      server: {
        status: "healthy",
        uptime: process.uptime(),
        memeoryUsage: process.memoryUsage(),
      },
    },
  };

  res.status(200).json(healthStatus);
});

export { healthCheck };
