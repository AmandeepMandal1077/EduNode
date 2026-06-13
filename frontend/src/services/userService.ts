
import type { User } from "../types";
import {
  apiGetProfile,
  apiUpdateProfile,
  type BackendUser,
} from "../api/userApi";


function mapUser(bu: BackendUser): User {
  return {
    id: bu._id,
    name: bu.name,
    email: bu.email,
    bio: bu.bio ?? "",
    avatarUrl: bu.avatar ?? `https://api.dicebear.com/8.x/avataaars/svg?seed=${bu._id}`,
    joinedAt: bu.createdAt,
    streakDays: 0,
    totalHoursLearned: 0,
    role: bu.role,
    purchases: [],
  };
}



/**
 * @desc Fetch the currently authenticated user's profile from the backend.
 * @input None
 * @output {Promise<User | null>} The user profile or null.
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
 * @desc Update user name and bio.
 * @input {Partial<User>} updates - The fields to update.
 * @output {Promise<User>} The updated user.
 */
export async function updateUser(updates: Partial<User>): Promise<User> {
  const bu = await apiUpdateProfile({
    name: updates.name,
    bio: updates.bio,
  });
  return mapUser(bu);
}

/**
 * @desc Update user avatar image via FormData.
 * @input {File} file - The avatar file.
 * @output {Promise<User>} The updated user.
 */
export async function updateAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("avatar", file);
  const bu = await apiUpdateProfile(form);
  return mapUser(bu);
}

/**
 * @desc Fetch purchase history records for the user.
 * @input None
 * @output {Promise<Array<Object>>} List of purchase history records.
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



/**
 * @desc Asynchronously probe profile API to determine auth status.
 * @input None
 * @output {Promise<boolean>} True if authenticated, false otherwise.
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    await apiGetProfile();
    return true;
  } catch {
    return false;
  }
}
