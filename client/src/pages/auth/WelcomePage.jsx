/**
 * @file WelcomePage.jsx
 * @description Post-login welcome/dashboard page shown after successful authentication.
 * Displays BIT branding card with user info and navigation shortcuts.
 */

import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

import { selectCurrentUser, selectIsAuthenticated, logoutUser } from "../../redux/slices/authSlice";

// ─── BIT Logo SVG ─────────────────────────────────────────────────────────────
const BITLogo = () => (
  <svg viewBox="0 0 120 100" width="180" height="153" aria-hidden="true"
    style={{ filter: "drop-shadow(0 6px 24px rgba(20,50,180,0.55))" }}>
    <text x="50%" y="72" textAnchor="middle" fontSize="90" fill="#2a3580"
      fontFamily="Georgia, serif" opacity="0.9">Ω</text>
    <g transform="translate(42, 28)">
      <polygon points="18,0 36,10 36,30 18,40 0,30 0,10" fill="#b8972a" stroke="#d4af3a" strokeWidth="1.5"/>
      <polygon points="18,0 36,10 18,20 0,10" fill="#d4af3a" stroke="#d4af3a" strokeWidth="1"/>
      <polygon points="0,10 18,20 18,40 0,30" fill="#a07820" stroke="#d4af3a" strokeWidth="1"/>
      <polygon points="36,10 18,20 18,40 36,30" fill="#c49a28" stroke="#d4af3a" strokeWidth="1"/>
      <text x="18" y="26" textAnchor="middle" fontSize="10" fill="white"
        fontWeight="bold" fontFamily="Arial, sans-serif">BIT</text>
    </g>
  </svg>
);

const WelcomePage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectCurrentUser);
  const isAuth    = useSelector(selectIsAuthenticated);

  // Redirect if not authenticated
  if (!isAuth) return <Navigate to="/login" replace />;

  const dashPath =
    user?.role === "admin"  ? "/admin/dashboard"  :
    user?.role === "warden" ? "/warden/dashboard" :
    "/student/dashboard";

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Signed out successfully");
    navigate("/login");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0d1e",
      backgroundImage:
        "radial-gradient(ellipse at 25% 40%, rgba(30,50,160,0.25) 0%, transparent 55%), " +
        "radial-gradient(ellipse at 75% 70%, rgba(80,20,180,0.15) 0%, transparent 50%)",
      padding: "1.5rem",
    }}>
      <motion.div
        style={{
          background: "linear-gradient(160deg, #141a38 0%, #0d1128 60%, #08091e 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "24px",
          padding: "2.5rem 2.5rem 2rem",
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 220, height: 220,
          background: "radial-gradient(circle, rgba(60,90,220,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Dashboard label */}
        <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.18em",
          color: "rgba(130,165,255,0.7)", textTransform: "uppercase", marginBottom: "0.15rem" }}>
          Dashboard
        </p>

        {/* Welcome text */}
        <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", marginBottom: "0.5rem" }}>
          Welcome Back!
        </p>

        {/* BIT Logo */}
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          <BITLogo />
        </div>
        <p style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", letterSpacing: "0.12em",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", margin: "0.15rem 0 0" }}>
          BANNARI AMMAN
        </p>
        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#c0cde8",
          letterSpacing: "0.14em", margin: 0 }}>
          INSTITUTE OF TECHNOLOGY
        </p>
        <p style={{ fontSize: "1.15rem", fontStyle: "italic", color: "#d0dcf5",
          fontFamily: "Georgia, serif", letterSpacing: "0.06em", margin: "0.1rem 0 0.75rem" }}>
          Stay Ahead
        </p>

        {/* User info */}
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", padding: "0.7rem 1rem",
            width: "100%", textAlign: "left", marginBottom: "0.5rem",
          }}>
            <img
              src={user.profileUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=2563eb&color=fff&size=80`}
              alt={user.name}
              style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover",
                flexShrink: 0, border: "2px solid rgba(100,140,255,0.45)" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fdfeffff",
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </p>
              <p style={{ fontSize: "0.74rem", color: "rgba(155,185,240,0.75)",
                margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
              <p style={{ fontSize: "0.7rem", color: "rgba(120,160,255,0.65)",
                margin: "0.1rem 0 0", textTransform: "capitalize" }}>
                {user.role} · BIT Portal
              </p>
            </div>
          </div>
        )}

        {/* Go to Dashboard */}
        <button
          id="bit-welcome-dashboard-btn"
          onClick={() => navigate(dashPath)}
          style={{
            width: "100%", padding: "0.85rem 1rem",
            background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #6d28d9 100%)",
            border: "none", borderRadius: "12px", color: "#f5efefff",
            fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.12em",
            cursor: "pointer", textTransform: "uppercase",
            boxShadow: "0 4px 20px rgba(124,58,237,0.55)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.7)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.55)";
          }}
        >
          Go to My Dashboard
        </button>

        {/* Sign out link */}
        <button
          onClick={handleLogout}
          style={{
            background: "none", border: "none",
            color: "rgba(160,190,255,0.4)", fontSize: "0.78rem",
            cursor: "pointer", marginTop: "0.5rem",
            display: "flex", alignItems: "center", gap: "0.35rem",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(160,190,255,0.8)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(160,190,255,0.4)"; }}
        >
          <LogOut size={12} />
          Sign out
        </button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
