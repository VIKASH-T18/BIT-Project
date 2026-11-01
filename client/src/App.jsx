/**
 * @file App.jsx
 * @description Root application component with route definitions,
 * protected routes, auth initialization, and Socket.IO setup.
 */

import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchCurrentUser } from "./redux/slices/authSlice";
import { selectCurrentUser, selectIsAuthenticated, selectIsInitialized } from "./redux/slices/authSlice";
import { selectTheme } from "./redux/slices/uiSlice";
import { connectSocket, disconnectSocket } from "./services/socket";
import { prependNotification } from "./redux/slices/notificationSlice";
import { addMessage, setOnlineUsers, setTyping, clearTyping, updateReaction } from "./redux/slices/chatSlice";
import { setConnected } from "./redux/slices/chatSlice";

// ─── Layouts ──────────────────────────────────────────────────────────────────
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout      from "./layouts/AuthLayout";
import LoadingScreen   from "./components/common/LoadingScreen";

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
import ProtectedRoute from "./routes/ProtectedRoute";

// ─── Auth Pages (eager-loaded) ────────────────────────────────────────────────
import LoginPage          from "./pages/auth/LoginPage";
import RegisterPage       from "./pages/auth/RegisterPage";
import VerifyEmailPage    from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/auth/ResetPasswordPage";
import WelcomePage        from "./pages/auth/WelcomePage";

// ─── Landing Page ─────────────────────────────────────────────────────────────
import LandingPage from "./pages/LandingPage";

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
// Student
const StudentDashboard       = lazy(() => import("./pages/student/StudentDashboard"));
const StudentProfile         = lazy(() => import("./pages/student/StudentProfile"));
const HostelApplication      = lazy(() => import("./pages/student/HostelApplication"));
const AllocationStatus       = lazy(() => import("./pages/student/AllocationStatus"));
const CompatibilityPage      = lazy(() => import("./pages/student/CompatibilityPage"));
const ChatPage               = lazy(() => import("./pages/student/ChatPage"));
const ComplaintsPage         = lazy(() => import("./pages/student/ComplaintsPage"));
const LeaveRequestPage       = lazy(() => import("./pages/student/LeaveRequestPage"));
const VisitorPage            = lazy(() => import("./pages/student/VisitorPage"));
const PaymentsPage           = lazy(() => import("./pages/student/PaymentsPage"));
const NoticesPage            = lazy(() => import("./pages/shared/NoticesPage"));
const MarketplacePage        = lazy(() => import("./pages/student/MarketplacePage"));
const LostFoundPage          = lazy(() => import("./pages/student/LostFoundPage"));
const MessPage               = lazy(() => import("./pages/student/MessPage"));
const LaundryPage            = lazy(() => import("./pages/student/LaundryPage"));
const EventsPage             = lazy(() => import("./pages/shared/EventsPage"));

// Warden
const WardenDashboard        = lazy(() => import("./pages/warden/WardenDashboard"));
const StudentApprovalPage    = lazy(() => import("./pages/warden/StudentApprovalPage"));
const RoomAllocationPage     = lazy(() => import("./pages/warden/RoomAllocationPage"));
const WardenComplaintsPage   = lazy(() => import("./pages/warden/WardenComplaintsPage"));
const WardenLeavePage        = lazy(() => import("./pages/warden/WardenLeavePage"));
const VisitorManagementPage  = lazy(() => import("./pages/warden/VisitorManagementPage"));
const BroadcastNoticePage    = lazy(() => import("./pages/warden/BroadcastNoticePage"));
const MessMenuPage           = lazy(() => import("./pages/shared/MessMenuPage"));

// Admin
const AdminDashboard         = lazy(() => import("./pages/admin/AdminDashboard"));
const StudentManagementPage  = lazy(() => import("./pages/admin/StudentManagementPage"));
const WardenManagementPage   = lazy(() => import("./pages/admin/WardenManagementPage"));
const RoomManagementPage     = lazy(() => import("./pages/admin/RoomManagementPage"));
const FeeManagementPage      = lazy(() => import("./pages/admin/FeeManagementPage"));
const AnalyticsPage          = lazy(() => import("./pages/admin/AnalyticsPage"));
const ReportsPage            = lazy(() => import("./pages/admin/ReportsPage"));
const SettingsPage           = lazy(() => import("./pages/admin/SettingsPage"));
const DocumentVerificationPage = lazy(() => import("./pages/admin/DocumentVerificationPage"));

// Shared
const NotificationsPage      = lazy(() => import("./pages/shared/NotificationsPage"));
const HostelMapPage          = lazy(() => import("./pages/shared/HostelMapPage"));
const ProfilePage            = lazy(() => import("./pages/shared/ProfilePage"));
const NotFoundPage           = lazy(() => import("./pages/NotFoundPage"));

// ─── App Component ────────────────────────────────────────────────────────────

function App() {
  const dispatch    = useDispatch();
  const user        = useSelector(selectCurrentUser);
  const isAuth      = useSelector(selectIsAuthenticated);
  const initialized = useSelector(selectIsInitialized);
  const theme       = useSelector(selectTheme);

  // ── Initialize Auth on Mount ──────────────────────────
  useEffect(() => {
    // Skip if already initialized (e.g. right after loginUser.fulfilled sets
    // isInitialized=true). Avoids a redundant /me request that could race
    // with other API calls and clear the token on a transient 401.
    if (initialized) return;

    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      // Mark as initialized even if no token
      dispatch({ type: "auth/setInitialized" });
    }
  }, [dispatch, initialized]);

  // ── Apply Theme ───────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ── Socket.IO Connection ──────────────────────────────
  useEffect(() => {
    if (!isAuth || !user) return;

    const token = localStorage.getItem("accessToken");
    const socket = connectSocket(token);

    dispatch(setConnected(true));

    // ── Socket Event Listeners ────────────────────────
    socket.on("notification", (notif) => {
      dispatch(prependNotification(notif));
    });

    socket.on("new_message", (msg) => {
      dispatch(addMessage({ roomId: msg.chatRoom, message: msg }));
    });

    socket.on("online_users", (users) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on("typing", ({ userId, chatRoomId }) => {
      dispatch(setTyping({ roomId: chatRoomId, userId }));
    });

    socket.on("stopped_typing", ({ userId, chatRoomId }) => {
      dispatch(clearTyping({ roomId: chatRoomId, userId }));
    });

    socket.on("reaction_updated", ({ messageId, reactions, chatRoom }) => {
      dispatch(updateReaction({ roomId: chatRoom, messageId, reactions }));
    });

    socket.on("disconnect", () => {
      dispatch(setConnected(false));
    });

    return () => {
      socket.off("notification");
      socket.off("new_message");
      socket.off("online_users");
      socket.off("typing");
      socket.off("stopped_typing");
      socket.off("reaction_updated");
      socket.off("disconnect");
    };
  }, [isAuth, user, dispatch]);

  // Cleanup socket on logout
  useEffect(() => {
    if (!isAuth) disconnectSocket();
  }, [isAuth]);

  // Show loading screen during init
  if (!initialized) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── Public Routes ────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
        </Route>

        {/* ── Welcome Page (post-login) ─────────────── */}
        <Route path="/welcome" element={<WelcomePage />} />

        {/* ── Student Routes ───────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard"      element={<StudentDashboard />} />
            <Route path="/student/profile"        element={<StudentProfile />} />
            <Route path="/student/application"    element={<HostelApplication />} />
            <Route path="/student/allocation"     element={<AllocationStatus />} />
            <Route path="/student/compatibility"  element={<CompatibilityPage />} />
            <Route path="/student/complaints"     element={<ComplaintsPage />} />
            <Route path="/student/leave"          element={<LeaveRequestPage />} />
            <Route path="/student/visitors"       element={<VisitorPage />} />
            <Route path="/student/payments"       element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/marketplace"    element={<MarketplacePage />} />
            <Route path="/student/lost-found"     element={<LostFoundPage />} />
            <Route path="/student/mess"           element={<MessPage />} />
            <Route path="/student/laundry"        element={<LaundryPage />} />
          </Route>
        </Route>

        {/* ── Warden Routes ────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["warden"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/warden/dashboard"   element={<WardenDashboard />} />
            <Route path="/warden/approvals"   element={<StudentApprovalPage />} />
            <Route path="/warden/allocation"  element={<RoomAllocationPage />} />
            <Route path="/warden/complaints"  element={<WardenComplaintsPage />} />
            <Route path="/warden/leave"       element={<WardenLeavePage />} />
            <Route path="/warden/visitors"    element={<VisitorManagementPage />} />
            <Route path="/warden/notices"     element={<BroadcastNoticePage />} />
            <Route path="/warden/mess-menu"   element={<MessMenuPage />} />
          </Route>
        </Route>

        {/* ── Admin Routes ─────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard"   element={<AdminDashboard />} />
            <Route path="/admin/approvals"   element={<StudentApprovalPage />} />
            <Route path="/admin/students"    element={<StudentManagementPage />} />
            <Route path="/admin/wardens"     element={<WardenManagementPage />} />
            <Route path="/admin/rooms"       element={<RoomManagementPage />} />
            <Route path="/admin/fees"        element={<FeeManagementPage />} />
            <Route path="/admin/analytics"   element={<AnalyticsPage />} />
            <Route path="/admin/reports"     element={<ReportsPage />} />
            <Route path="/admin/documents"   element={<DocumentVerificationPage />} />
            <Route path="/admin/settings"    element={<SettingsPage />} />
            <Route path="/admin/mess-menu"   element={<MessMenuPage />} />
          </Route>
        </Route>

        {/* ── Shared Auth Routes ───────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={["student", "warden", "admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/chat"              element={<ChatPage />} />
            <Route path="/chat/:roomId"      element={<ChatPage />} />
            <Route path="/notifications"     element={<NotificationsPage />} />
            <Route path="/hostel-map"        element={<HostelMapPage />} />
            <Route path="/profile"           element={<ProfilePage />} />
            <Route path="/notices"           element={<NoticesPage />} />
            <Route path="/events"            element={<EventsPage />} />
          </Route>
        </Route>

        {/* ── Redirect based on role ───────────────── */}
        <Route
          path="/dashboard"
          element={
            isAuth
              ? user?.role === "admin"   ? <Navigate to="/admin/dashboard" />
              : user?.role === "warden"  ? <Navigate to="/warden/dashboard" />
              : <Navigate to="/student/dashboard" />
              : <Navigate to="/login" />
          }
        />

        {/* ── 404 ──────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
