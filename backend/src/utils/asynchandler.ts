import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";

export const asyncHandler = <T>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as T, res, next)).catch(next);
  };
};
