import { asyncHandler } from "../utils/asynchandler.js";
import { connectionStatus } from "../database/db.js";

import { type Request, type Response } from "express";

/**
 * @desc Retrieves the health status of the application including database and server metrics.
 * @input {Request} _ - The Express request object.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the health status.
 */
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
