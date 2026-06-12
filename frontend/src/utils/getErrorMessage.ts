import type { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    // Check for Axios error shape
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    return error.message;
  }
  if (typeof error === "string") return error;
  return fallback;
}
