/**
 * @file RegisterPage.jsx
 * @description Modern BIT Hostel portal registration page with role selection
 * (Student, Warden, Admin), comprehensive validation, instant auto-login,
 * and matching Omega portal dark aesthetics.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, UserPlus, Mail, Lock, User,
  GraduationCap, Shield, Building2, Phone, CheckCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

import { registerUser, selectAuthLoading, selectAuthError, clearError } from "../../redux/slices/authSlice";

// ─── BIT Logo SVG ────────────────────────────────────────────────────────────
const BITLogo = ({ size = 90 }) => (
  <svg viewBox="0 0 120 100" width={size} height={size * 0.85} aria-hidden="true"
    style={{ filter: "drop-shadow(0 4px 14px rgba(40,70,200,0.4))" }}>
    <text x="50%" y="72" textAnchor="middle" fontSize="90" fill="#2a3580"
      fontFamily="Georgia, serif" opacity="0.95">Ω</text>
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

const DEPARTMENTS = [
  "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML",
  "CSD", "IoT", "CHEMICAL", "BIOTECH", "MBA", "MCA"
];

const RegisterPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    registerNumber: "",
    department: "CSE",
    year: 1,
    gender: "male",
    employeeId: "",
    phone: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    // Basic Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (role === "student" && !formData.registerNumber.trim()) {
      toast.error("Please provide your Student Register Number.");
      return;
    }

    const payload = {
      ...formData,
      role,
      email: formData.email.trim().toLowerCase(),
      year: Number(formData.year),
    };

    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      const data = result.payload;
      if (data?.accessToken && data?.user) {
        toast.success(`Account created! Welcome to BIT Hostel, ${data.user.name.split(" ")[0]}! 🎉`);
        navigate("/welcome", { replace: true });
      } else {
        toast.success("Account created successfully! Check your OTP to verify.");
        navigate("/verify-email", {
          state: {
            email: formData.email,
            name: formData.name,
            devOtp: data?.otp,
          }
        });
      }
    } else {
      toast.error(result.payload || "Registration failed. Please check your details.");
    }
  };

  return (
    <div className="bit-login-page" style={{ padding: "2rem 1rem" }}>
      <motion.div
        className="bit-login-card"
        style={{ maxWidth: "520px", padding: "2rem 2.2rem" }}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Header Branding */}
        <div className="bit-logo-area" style={{ marginBottom: "0.8rem" }}>
          <div className="bit-omega-ring" style={{ width: "90px", height: "80px" }}>
            <BITLogo size={90} />
          </div>
          <p className="bit-college-name" style={{ fontSize: "0.95rem" }}>BANNARI AMMAN</p>
          <p className="bit-college-sub" style={{ fontSize: "0.65rem" }}>INSTITUTE OF TECHNOLOGY</p>
        </div>

        <h2 style={{
          fontSize: "1.35rem",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0.2rem 0 0.4rem",
          fontFamily: "var(--font-display, 'Plus Jakarta Sans', system-ui, sans-serif)"
        }}>
          Create Your Account 🎓
        </h2>
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", marginBottom: "1.2rem" }}>
          Register for the BIT Hostel Management Portal
        </p>

        {/* Role Selection Tabs */}
        <div style={{
          display: "flex",
          background: "rgba(255, 255, 255, 0.05)",
          padding: "0.3rem",
          borderRadius: "10px",
          width: "100%",
          marginBottom: "1.2rem",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          {[
            { id: "student", label: "Student", icon: GraduationCap },
            { id: "warden", label: "Warden", icon: Building2 },
            { id: "admin", label: "Admin", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = role === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setRole(tab.id); dispatch(clearError()); }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 0.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(37,99,235,0.4)" : "none",
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Box */}
        <AnimatePresence>
          {authError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="bit-error-box"
            >
              ⚠️ {authError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bit-login-form" style={{ gap: "0.85rem" }}>
          {/* Full Name & Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
            <div className="bit-field">
              <label htmlFor="reg-name" className="bit-label">Full Name *</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Arjun Kumar"
                className="bit-input"
                required
              />
            </div>

            <div className="bit-field">
              <label htmlFor="reg-email" className="bit-label">College Email *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@bitsathy.ac.in"
                className="bit-input"
                required
              />
            </div>
          </div>

          {/* Passwords */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
            <div className="bit-field">
              <label htmlFor="reg-pwd" className="bit-label">Password *</label>
              <div className="bit-input-wrap">
                <input
                  id="reg-pwd"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="bit-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="bit-eye-btn"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="bit-field">
              <label htmlFor="reg-cpwd" className="bit-label">Confirm Password *</label>
              <div className="bit-input-wrap">
                <input
                  id="reg-cpwd"
                  name="confirmPassword"
                  type={showConfirmPwd ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="bit-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((p) => !p)}
                  className="bit-eye-btn"
                  aria-label="Toggle confirm password"
                >
                  {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Role Specific Fields */}
          {role === "student" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: "0.85rem", width: "100%" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
                <div className="bit-field">
                  <label htmlFor="reg-regno" className="bit-label">Register Number *</label>
                  <input
                    id="reg-regno"
                    name="registerNumber"
                    type="text"
                    value={formData.registerNumber}
                    onChange={handleChange}
                    placeholder="e.g. 7376211CS101"
                    className="bit-input"
                    style={{ textTransform: "uppercase" }}
                    required
                  />
                </div>

                <div className="bit-field">
                  <label htmlFor="reg-dept" className="bit-label">Department</label>
                  <select
                    id="reg-dept"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="bit-input"
                    style={{ background: "#111a3e" }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} style={{ background: "#111a3e", color: "#fff" }}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
                <div className="bit-field">
                  <label htmlFor="reg-year" className="bit-label">Year of Study</label>
                  <select
                    id="reg-year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="bit-input"
                    style={{ background: "#111a3e" }}
                  >
                    <option value={1} style={{ background: "#111a3e", color: "#fff" }}>1st Year</option>
                    <option value={2} style={{ background: "#111a3e", color: "#fff" }}>2nd Year</option>
                    <option value={3} style={{ background: "#111a3e", color: "#fff" }}>3rd Year</option>
                    <option value={4} style={{ background: "#111a3e", color: "#fff" }}>4th Year</option>
                  </select>
                </div>

                <div className="bit-field">
                  <label htmlFor="reg-gender" className="bit-label">Gender</label>
                  <select
                    id="reg-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="bit-input"
                    style={{ background: "#111a3e" }}
                  >
                    <option value="male" style={{ background: "#111a3e", color: "#fff" }}>Male (Boys Hostel)</option>
                    <option value="female" style={{ background: "#111a3e", color: "#fff" }}>Female (Girls Hostel)</option>
                    <option value="other" style={{ background: "#111a3e", color: "#fff" }}>Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {role !== "student" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}
            >
              <div className="bit-field">
                <label htmlFor="reg-empid" className="bit-label">Employee / Staff ID</label>
                <input
                  id="reg-empid"
                  name="employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder={role === "warden" ? "e.g. WRD-101" : "e.g. ADM-101"}
                  className="bit-input"
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              <div className="bit-field">
                <label htmlFor="reg-phone" className="bit-label">Contact Phone</label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="bit-input"
                />
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            id="bit-register-submit-btn"
            type="submit"
            disabled={isLoading}
            className="bit-google-btn"
            style={{
              marginTop: "0.75rem",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            {isLoading ? (
              <span className="bit-spinner" />
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div style={{
          marginTop: "1.2rem",
          paddingTop: "0.9rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.6)",
        }}>
          <span>Already have an account?</span>
          <Link
            to="/login"
            style={{
              color: "#38bdf8",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem"
            }}
          >
            Sign In →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
