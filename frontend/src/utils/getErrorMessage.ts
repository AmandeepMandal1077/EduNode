import type { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

/**
 * @desc Extracts an error message from a thrown exception.
 * @input {unknown} error - The caught error object.
 * @input {string} [fallback="An unexpected error occurred"] - Default message.
 * @output {string} The error message string.
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    return error.message;
  }
  if (typeof error === "string") return error;
  return fallback;
}
