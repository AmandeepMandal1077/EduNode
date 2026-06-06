export class ApiError extends Error {
  statusCode: number;
  status: string;
  operational: boolean;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? "Failed" : "Server Error";
    this.operational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
