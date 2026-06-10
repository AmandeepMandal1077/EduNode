import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { checkAuthThunk, logoutThunk } from "../store/authSlice";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated: authenticated, currentUser: user, loading } = useSelector(
    (state: RootState) => state.auth
  );

  const refresh = useCallback(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch(logoutThunk());
  }, [dispatch]);

  return { authenticated, user, loading, logout, refresh };
}
