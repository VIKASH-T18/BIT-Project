/**
 * @file WelcomeCard.jsx
 * @description Post-login welcome card matching the BIT dashboard design.
 * Shows BIT logo, "Welcome Back!", user info, and quick navigation.
 */

import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser, selectUserProfile } from "../../redux/slices/authSlice";

// ─── BIT Logo SVG ─────────────────────────────────────────────────────────────
const BITLogo = ({ size = 160 }) => (
  <svg
    viewBox="0 0 120 100"
    width={size}
    height={size * 0.85}
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 6px 20px rgba(20,50,180,0.5))" }}
  >
    <text
      x="50%" y="72"
      textAnchor="middle"
      fontSize="90"
      fill="#2a3580"
      fontFamily="Georgia, serif"
      opacity="0.9"
    >Ω</text>
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

const WelcomeCard = () => {
  const user    = useSelector(selectCurrentUser);
  const profile = useSelector(selectUserProfile);
  const navigate = useNavigate();

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const roleLabel = {
    student: "Student Portal",
    warden:  "Warden Portal",
    admin:   "Admin Portal",
  }[user?.role] || "Portal";

  return (
    <motion.div
      className="bit-welcome-card"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top label */}
      <p className="bit-wc-role">{roleLabel}</p>

      {/* Title */}
      <p className="bit-wc-greeting">{greeting()}, {user?.name?.split(" ")[0]}! 👋</p>
      <p className="bit-wc-subtitle">Welcome Back!</p>

      {/* BIT Logo */}
      <div className="bit-wc-logo">
        <BITLogo size={150} />
        <p className="bit-wc-college-name">BANNARI AMMAN</p>
        <p className="bit-wc-college-sub">INSTITUTE OF TECHNOLOGY</p>
        <p className="bit-wc-college-tag">Stay Ahead</p>
      </div>

      {/* User info pill */}
      {user && (
        <div className="bit-wc-user-pill">
          <img
            src={
              user.profileUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=2563eb&color=fff&size=64`
            }
            alt={user.name}
            className="bit-wc-avatar"
          />
          <div className="bit-wc-user-info">
            <p className="bit-wc-user-name">{user.name}</p>
            <p className="bit-wc-user-email">{user.email}</p>
            {profile?.department && (
              <p className="bit-wc-user-dept">
                {profile.department}
                {profile.year ? ` · Year ${profile.year}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Go to Dashboard CTA */}
      <button
        id="bit-go-dashboard-btn"
        className="bit-wc-cta-btn"
        onClick={() => navigate(
          user?.role === "admin"  ? "/admin/dashboard"  :
          user?.role === "warden" ? "/warden/dashboard" :
          "/student/dashboard"
        )}
      >
        Go to Dashboard →
      </button>
    </motion.div>
  );
};

export default WelcomeCard;
