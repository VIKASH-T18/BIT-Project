/**
 * @file ProtectedRoute.jsx
 * @description Route guard — redirects unauthenticated users to login,
 * and unauthorized roles to their own dashboard.
 */

import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectCurrentUser, selectIsAuthenticated } from "../redux/slices/authSlice";

const roleDashboards = {
  student: "/student/dashboard",
  warden:  "/warden/dashboard",
  admin:   "/admin/dashboard",
};

/**
 * @param {string[]} allowedRoles - Roles permitted to access this route
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const isAuth   = useSelector(selectIsAuthenticated);
  const user     = useSelector(selectCurrentUser);
  const location = useLocation();

  // Not authenticated → redirect to login
  if (!isAuth || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const correctDashboard = roleDashboards[user.role] || "/login";
    return <Navigate to={correctDashboard} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
