/**
 * purchaseApi.ts
 * All calls that map to /api/v1/payments
 *
 * Backend route reference:
 *   GET  /api/v1/payments/                               → getPurchasedCourses
 *   GET  /api/v1/payments/course/:courseId/detail-with-status → getCoursePurchaseStatus
 *   POST /api/v1/payments/create-checkout-session        → initiateStripeCheckout
 *   POST /api/v1/payments/checkout/verify                → verifyStripeSession
 */

import apiClient from "./client";
import type { BackendCourse } from "./courseApi";

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
  sessionId: string;
  url: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * @desc: Fetch all purchases completed by the logged-in user
 * @input: none
 * @return: Promise<PurchaseRecord[]>
 * @access: Private
 */
export async function fetchPurchasedCourses(): Promise<PurchaseRecord[]> {
  const res = await apiClient.get("/payments");
  return res.data?.data?.purchases ?? res.data?.purchases ?? [];
}

/**
 * @desc: Fetch purchase status and record details for a specific course
 * @input: courseId (string)
 * @return: Promise<CoursePurchaseStatus>
 * @access: Private
 */
export async function fetchCoursePurchaseStatus(
  courseId: string
): Promise<CoursePurchaseStatus> {
  const res = await apiClient.get(`/payments/course/${courseId}/detail-with-status`);
  return res.data?.data ?? res.data;
}

/**
 * @desc: Create a Stripe checkout session to purchase a course
 * @input: courseId (string)
 * @return: Promise<CheckoutSession>
 * @access: Private
 */
export async function createCheckoutSession(
  courseId: string
): Promise<CheckoutSession> {
  const res = await apiClient.post("/payments/create-checkout-session", { courseId });
  return res.data?.data ?? res.data;
}

/**
 * @desc: Verify a Stripe checkout session's payment completion status
 * @input: sessionId (string)
 * @return: Promise<{ success: boolean; purchase: PurchaseRecord }>
 * @access: Private
 */
export async function verifyCheckoutSession(
  sessionId: string
): Promise<{ paid: boolean; purchase: PurchaseRecord }> {
  const res = await apiClient.post(`/payments/checkout/verify?session_id=${sessionId}`);
  return res.data?.data ?? res.data;
}
