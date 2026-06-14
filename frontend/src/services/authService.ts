
import { apiSignin, apiSignup, apiSignout } from "../api/userApi";
import { checkAuthStatus } from "./userService";

export { checkAuthStatus };

/**
 * @desc Log in a user with email and password.
 * @input {string} email - User email.
 * @input {string} password - User password.
 * @input {string} [role] - Optional role.
 * @output {Promise<{ success: boolean; error?: string }>} Login result.
 */
export async function login(
  email: string,
  password: string,
  role?: string
): Promise<{ success: boolean; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }
  try {
    await apiSignin({ email, password, role });
    return { success: true };
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Invalid email or password.";
    return { success: false, error: msg };
  }
}

/**
 * @desc Register a new user account.
 * @input {string} name - User name.
 * @input {string} email - User email.
 * @input {string} password - User password.
 * @input {string} [role] - Optional role.
 * @output {Promise<{ success: boolean; error?: string }>} Registration result.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  role?: string
): Promise<{ success: boolean; error?: string }> {
  if (!name || !email || !password) {
    return { success: false, error: "All fields are required." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  try {
    await apiSignup({ name, email, password, role });
    return { success: true };
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Registration failed. Please try again.";
    return { success: false, error: msg };
  }
}

/**
 * @desc Log out the current user and clear credentials.
 * @input None
 * @output {Promise<void>} Resolves on successful logout.
 */
export async function logout(): Promise<void> {
  await apiSignout();
}
