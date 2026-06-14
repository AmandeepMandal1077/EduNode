
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



/**
 * @desc Register a new user account on the server.
 * @input {Object} body - Contains name, email, password, and optional role.
 * @output {Promise<{ user: BackendUser }>} The created user data.
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
 * @desc Authenticate a user with email and password.
 * @input {Object} body - Contains email, password, and optional role.
 * @output {Promise<{ user: BackendUser }>} The authenticated user data.
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
 * @desc Invalidate the current session and clear auth cookies.
 * @input None
 * @output {Promise<void>} Resolves on successful signout.
 */
export async function apiSignout(): Promise<void> {
  await apiClient.post("/users/signout");
}



/**
 * @desc Fetch the authenticated user's profile details.
 * @input None
 * @output {Promise<BackendUser>} The user's profile data.
 */
export async function apiGetProfile(): Promise<BackendUser> {
  const res = await apiClient.get("/users/profile");
  return res.data?.data?.user ?? res.data?.user;
}

/**
 * @desc Update the profile information or upload an avatar.
 * @input {Object|FormData} body - The profile data to update.
 * @output {Promise<BackendUser>} The updated user profile.
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



/**
 * @desc Change the authenticated user's password.
 * @input {Object} body - Contains the new password.
 * @output {Promise<void>} Resolves on successful password change.
 */
export async function apiChangePassword(body: {
  password: string;
}): Promise<void> {
  await apiClient.patch("/users/change-password", body);
}

/**
 * @desc Trigger a forgot password recovery email.
 * @input {string} email - The email address.
 * @output {Promise<void>} Resolves on successful request.
 */
export async function apiForgotPassword(email: string): Promise<void> {
  await apiClient.post("/users/forgot-password", { email });
}

/**
 * @desc Reset the password using a valid token from the email link.
 * @input {Object} body - Contains email, token, and new password.
 * @output {Promise<void>} Resolves on successful reset.
 */
export async function apiResetPassword(body: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post("/users/reset-password", body);
}



/**
 * @desc Delete the authenticated user's account permanently.
 * @input None
 * @output {Promise<void>} Resolves on successful deletion.
 */
export async function apiDeleteAccount(): Promise<void> {
  await apiClient.delete("/users/account");
}