import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login, register, logout, checkAuthStatus } from "../services/authService";
import { getCurrentUser } from "../services/userService";
import type { User } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  currentUser: null,
  loading: false,
  error: null,
  isInitialized: false,
};

export const checkAuthThunk = createAsyncThunk(
  "auth/checkAuth",
  async (_, { dispatch }) => {
    const isOk = await checkAuthStatus();
    if (isOk) {
      dispatch(fetchProfileThunk());
    }
    return isOk;
  }
);

export const fetchProfileThunk = createAsyncThunk(
  "auth/fetchProfile",
  async () => {
    const user = await getCurrentUser();
    return user;
  }
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string; role?: string }, { dispatch, rejectWithValue }) => {
    const res = await login(credentials.email, credentials.password, credentials.role);
    if (res.success) {
      dispatch(fetchProfileThunk());
      return true;
    }
    return rejectWithValue(res.error ?? "Login failed");
  }
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (data: { name: string; email: string; password: string; role?: string }, { dispatch, rejectWithValue }) => {
    const res = await register(data.name, data.email, data.password, data.role);
    if (res.success) {
      dispatch(fetchProfileThunk());
      return true;
    }
    return rejectWithValue(res.error ?? "Registration failed");
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async () => {
    await logout();
    return true;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuthThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload;
        state.loading = false;
        state.isInitialized = true;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.isAuthenticated = false;
        state.loading = false;
        state.isInitialized = true;
      })
      // Fetch Profile
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        if (action.payload) state.isAuthenticated = true;
      })
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state) => {
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.currentUser = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
