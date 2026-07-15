import type { Request, Response, NextFunction } from "express";
import debug from "../utils/debug.js";

export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers["x-internal-secret"];

  if (!process.env.INTERNAL_API_SECRET) {
    debug("INTERNAL_API_SECRET is not configured");
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }

  if (secret !== process.env.INTERNAL_API_SECRET) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  next();
};
