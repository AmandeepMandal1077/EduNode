import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { ApiError } from "../utils/apiError.js";

export enum SourceType {
  BODY = "body",
  QUERY = "query",
  PARAMS = "params",
  HEADERS = "headers",
}

/**
 * @desc Validates request data (body, query, params) against a provided Zod schema.
 * @input {SourceType} source - The part of the request to validate.
 * @input {z.ZodType} schema - The Zod schema to validate against.
 * @output {Function} Express middleware function that validates the request.
 */
export function validator(source: SourceType, schema: z.ZodType) {
  return (req: Request, _: Response, next: NextFunction) => {
    try {
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
