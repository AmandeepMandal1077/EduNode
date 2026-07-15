import apiClient from "./client";
import type { BackendCourse } from "./courseApi";
import type { CourseProgressResponse } from "./progressApi";

export interface PurchaseRecord {
  _id: string;
  course: BackendCourse | string;
  user: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "refunded" | "failed";
  paymentMethod: string;
  paymentId: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePurchaseStatus {
  isPurchased?: boolean;
  purchase?: PurchaseRecord | null;
  course?: BackendCourse;
  status?: string;
}

export interface CheckoutSession {
  url: string;
}

/**
 * @desc Fetch all purchases completed by the logged-in user.
 * @input None
 * @output {Promise<PurchaseRecord[]>} List of purchase records.
 */
export async function fetchPurchasedCourses(): Promise<PurchaseRecord[]> {
  const res = await apiClient.get("/payments");
  return res.data?.data?.purchases ?? res.data?.purchases ?? [];
}

/**
 * @desc Fetch purchase status and record details for a specific course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<CoursePurchaseStatus>} The purchase status data.
 */
export async function fetchCoursePurchaseStatus(
  courseId: string,
): Promise<CoursePurchaseStatus> {
  const res = await apiClient.get(
    `/payments/course/${courseId}/detail-with-status`,
  );
  return res.data?.data ?? res.data;
}

/**
 * @desc Create a Stripe checkout session to purchase a course.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<CheckoutSession>} The checkout session details.
 */
export async function createCheckoutSession(
  courseId: string,
): Promise<CheckoutSession> {
  const res = await apiClient.post("/payments/create-checkout-session", {
    courseId,
  });
  return res.data?.data ?? res.data;
}

/**
 * @desc Enroll in a free course without Stripe.
 * @input {string} courseId - The ID of the course.
 * @output {Promise<void>} Resolves on successful enrollment.
 */
export async function enrollFreeCourse(courseId: string): Promise<void> {
  await apiClient.post("/payments/enroll-free", { courseId });
}

/**
 * @desc Verify a Stripe checkout session's payment completion status.
 * @input {string} sessionId - The Stripe session ID.
 * @output {Promise<{ paid: boolean; purchase: PurchaseRecord }>} The verification result.
 */
export async function verifyCheckoutSession(
  sessionId: string,
): Promise<{ paid: boolean; purchase: PurchaseRecord }> {
  const res = await apiClient.post(`/payments/checkout/verify`, {
    session_id: sessionId,
  });
  return res.data?.data ?? res.data;
}

export interface BackendEnrollmentData {
  purchase: PurchaseRecord;
  course: BackendCourse;
  progress: CourseProgressResponse | null;
}

/**
 * @desc Fetch all aggregated enrollment data for the user.
 * @input None
 * @output {Promise<BackendEnrollmentData[]>} List of enrollments.
 */
export async function fetchMyEnrollments(): Promise<BackendEnrollmentData[]> {
  const res = await apiClient.get("/payments/my-enrollments");
  return res.data?.data?.enrollments ?? [];
}
