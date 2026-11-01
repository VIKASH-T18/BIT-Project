/**
 * @file AuthLayout.jsx
 * @description Full-screen dark background layout for authentication pages.
 */

import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser } from "../redux/slices/authSlice";

const AuthLayout = () => {
  const isAuth = useSelector(selectIsAuthenticated);
  const user   = useSelector(selectCurrentUser);

  // Redirect authenticated users to their dashboard
  if (isAuth && user) {
    const paths = { admin: "/admin/dashboard", warden: "/warden/dashboard", student: "/student/dashboard" };
    return <Navigate to={paths[user.role] || "/student/dashboard"} replace />;
  }

  return (
    <div className="bit-auth-layout">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
