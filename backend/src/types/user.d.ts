import type { Request } from "express";

declare interface AuthenticatedRequest extends Request {
  userId: string;
}
