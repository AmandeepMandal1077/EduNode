/**
 * userApi.ts
 * All calls that map to /api/v1/users
 *
 * Backend route reference:
 *   POST  /api/v1/users/signup                → createUserAccount
 *   POST  /api/v1/users/signin                → authenticateUser
 *   POST  /api/v1/users/signout               → signOutUser
 *   GET   /api/v1/users/profile               → getCurrentUserProfile  [auth]
 *   PATCH /api/v1/users/profile               → updateUserProfile      [auth, multipart]
 *   PATCH /api/v1/users/change-password       → changeUserPassword     [auth]
 *   POST  /api/v1/users/forgot-password       → forgotPassword         [auth]
 *   POST  /api/v1/users/reset-password        → resetPassword          [auth]
 *   DELETE /api/v1/users/account              → deleteUserAccount      [auth]
 */

import apiClient from "./client";

export interface BackendUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  avatar?: string;
  bio?: string;
  enrolledCourses?: { course: string }[];
  createdCourses?: { course: string }[];
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * @desc: Register a new user account on the server
 * @input: body (object containing name: string, email: string, password: string, role?: string)
 * @return: Promise<{ user: BackendUser }>
 * @access: Public
 */
export async function apiSignup(body: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<{ user: BackendUser }> {
  const res = await apiClient.post("/users/signup", body);
  return res.data?.data ?? res.data;
}

/**
 * @desc: Authenticate a user with email and password
 * @input: body (object containing email: string, password: string, role?: string)
 * @return: Promise<{ user: BackendUser }>
 * @access: Public
 */
export async function apiSignin(body: {
  email: string;
  password: string;
  role?: string;
}): Promise<{ user: BackendUser }> {
  const res = await apiClient.post("/users/signin", body);
  return res.data?.data ?? res.data;
}

/**
 * @desc: Invalidate the current session and clear auth cookies
 * @input: none
 * @return: Promise<void>
 * @access: Private
 */
export async function apiSignout(): Promise<void> {
  await apiClient.post("/users/signout");
}

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * @desc: Fetch the authenticated user's profile details
 * @input: none
 * @return: Promise<BackendUser>
 * @access: Private
 */
export async function apiGetProfile(): Promise<BackendUser> {
  const res = await apiClient.get("/users/profile");
  return res.data?.data?.user ?? res.data?.user;
}

/**
 * @desc: Update the profile information or upload an avatar
 * @input: body (object containing name/bio, OR FormData containing avatar file)
 * @return: Promise<BackendUser>
 * @access: Private
 */
export async function apiUpdateProfile(
  body: { name?: string; bio?: string } | FormData
): Promise<BackendUser> {
  const isFormData = body instanceof FormData;
  const res = await apiClient.patch("/users/profile", body, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return res.data?.data?.user ?? res.data?.user;
}

// ── Password ──────────────────────────────────────────────────────────────────

/**
 * @desc: Change the authenticated user's password
 * @input: body (object containing currentPassword: string, newPassword: string)
 * @return: Promise<void>
 * @access: Private
 */
export async function apiChangePassword(body: {
  password: string;
}): Promise<void> {
  await apiClient.patch("/users/change-password", body);
}

/**
 * @desc: Trigger a forgot password recovery email
 * @input: email (string)
 * @return: Promise<void>
 * @access: Public
 */
export async function apiForgotPassword(email: string): Promise<void> {
  await apiClient.post("/users/forgot-password", { email });
}

/**
 * @desc: Reset the password using a valid token
 * @input: body (object containing token: string, newPassword: string)
 * @return: Promise<void>
 * @access: Public
 */
export async function apiResetPassword(body: {
  resetPasswordToken: string;
}): Promise<void> {
  await apiClient.post("/users/reset-password", body);
}

// ── Account ───────────────────────────────────────────────────────────────────

/**
 * @desc: Delete the authenticated user's account permanently
 * @input: none
 * @return: Promise<void>
 * @access: Private
 */
export async function apiDeleteAccount(): Promise<void> {
  await apiClient.delete("/users/account");
}