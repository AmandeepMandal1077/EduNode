import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { ApiError } from "../utils/apiError.js";

export enum SourceType {
  BODY = "body",
  QUERY = "query",
  PARAMS = "params",
  HEADERS = "headers",
}

export function validator(source: SourceType, schema: z.ZodType) {
  return (req: Request, _: Response, next: NextFunction) => {
    try {
      // console.log(req[source]);
      const data = schema.parse(req[source]);
      Object.assign(req[source], data);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.issues.map((error) => error.message).join(", ");
        return next(new ApiError(message, 400));
      }

      next(err);
    }
  };
}
