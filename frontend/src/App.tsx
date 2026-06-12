import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";
import { checkAuthThunk } from "./store/authSlice";
import { AppLayout } from "./components/layout/AppLayout";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ExplorePage } from "./pages/ExplorePage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MyCoursesPage } from "./pages/MyCoursesPage";
import { LearningRoomPage } from "./pages/LearningRoomPage";
import { ProfilePage } from "./pages/ProfilePage";
import { InstructorCoursesPage } from "./pages/InstructorCoursesPage";
import { CreateCoursePage } from "./pages/CreateCoursePage";
import { InstructorCourseManagePage } from "./pages/InstructorCourseManagePage";
import { SuccessPage } from "./pages/SuccessPage";
import { CancelPage } from "./pages/CancelPage";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isInitialized, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <AppLayout>
              <LandingPage />
            </AppLayout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/explore"
          element={
            <AppLayout>
              <ExplorePage />
            </AppLayout>
          }
        />
        <Route
          path="/course/:id"
          element={
            <AppLayout>
              <CourseDetailPage />
            </AppLayout>
          }
        />

        {/* Protected */}
        <Route
          path="/success"
          element={
            <AuthGuard>
              <SuccessPage />
            </AuthGuard>
          }
        />
        <Route
          path="/cancel"
          element={
            <AuthGuard>
              <CancelPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/my-courses"
          element={
            <AuthGuard>
              <AppLayout>
                <MyCoursesPage />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/learn/:courseId/lecture/:lectureId"
          element={
            <AuthGuard>
              {/* No AppLayout — Learning Room hides nav for full screen */}
              <LearningRoomPage />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/instructor/courses"
          element={
            <AuthGuard>
              <AppLayout>
                <InstructorCoursesPage />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/instructor/courses/create"
          element={
            <AuthGuard>
              <AppLayout>
                <CreateCoursePage />
              </AppLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/instructor/courses/:courseId/manage"
          element={
            <AuthGuard>
              <AppLayout>
                <InstructorCourseManagePage />
              </AppLayout>
            </AuthGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
