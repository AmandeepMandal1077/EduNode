/**
 * userService.ts
 * Business-logic adapter between pages and the userApi layer.
 * Maps BackendUser → User (frontend types).
 *
 * "localStorage" has been completely removed — auth state is server-driven
 * via HTTP-only cookies managed by the backend.
 */

import type { User } from "../types";
import {
  apiGetProfile,
  apiUpdateProfile,
  type BackendUser,
} from "../api/userApi";

// ── Mapper ────────────────────────────────────────────────────────────────────
function mapUser(bu: BackendUser): User {
  return {
    id: bu._id,
    name: bu.name,
    email: bu.email,
    bio: bu.bio ?? "",
    avatarUrl: bu.avatar ?? `https://api.dicebear.com/8.x/avataaars/svg?seed=${bu._id}`,
    joinedAt: bu.createdAt,
    streakDays: 0,  // Not tracked server-side yet; can be computed from lastActive later
    totalHoursLearned: 0,  // Not tracked server-side yet
    role: bu.role,
    purchases: [],  // Populated separately via purchaseApi if needed
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API  (same signatures pages already call)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc: Fetch the currently authenticated user's profile from the backend
 * @input: none
 * @return: Promise<User | null>
 * @access: Private (requires authentication)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const bu = await apiGetProfile();
    return mapUser(bu);
  } catch {
    return null;
  }
}

/**
 * @desc: Update user name and bio
 * @input: updates (Partial<User>)
 * @return: Promise<User>
 * @access: Private
 */
export async function updateUser(updates: Partial<User>): Promise<User> {
  const bu = await apiUpdateProfile({
    name: updates.name,
    bio: updates.bio,
  });
  return mapUser(bu);
}

/**
 * @desc: Update user avatar image via FormData
 * @input: file (File)
 * @return: Promise<User>
 * @access: Private
 */
export async function updateAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("avatar", file);
  const bu = await apiUpdateProfile(form);
  return mapUser(bu);
}

/**
 * @desc: Fetch purchase history records for the user
 * @input: none
 * @return: Promise<Array<{ id: string, courseId: string, courseTitle: string, amount: number, currency: string, paymentMethod: string, status: string, purchasedAt: string, invoiceUrl: string }>>
 * @access: Private
 */
export async function getPurchaseHistory() {
  const { fetchPurchasedCourses } = await import("../api/purchaseApi");
  const purchases = await fetchPurchasedCourses();
  return purchases.map((p) => ({
    id: p._id,
    courseId: typeof p.course === "string" ? p.course : (p.course as { _id: string })._id,
    courseTitle: typeof p.course === "object" && p.course ? (p.course as any).title : "Unknown Course",
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    status: p.status,
    purchasedAt: p.createdAt,
    invoiceUrl: "",
  }));
}

// ── Auth state helpers ────────────────────────────────────────────────────────
// Auth is managed server-side via HTTP-only cookies.
// We probe the /users/profile endpoint to determine auth status.

/**
 * @desc: Asynchronously probe profile API to determine auth status
 * @input: none
 * @return: Promise<boolean>
 * @access: Public
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    await apiGetProfile();
    return true;
  } catch {
    return false;
  }
}
