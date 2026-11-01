/**
 * @file LandingPage.jsx
 * @description Beautiful animated landing page — hero, features, stats, CTA.
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Shield, MessageSquare, Map, CreditCard, Users,
  BarChart3, QrCode, ChevronRight, Star, ArrowRight
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  { icon: Sparkles,     title: "AI Roommate Matching",      desc: "Weighted cosine similarity algorithm scores 20+ lifestyle parameters — sleep, study habits, cleanliness, food, personality — with hard conflict filters.", color: "from-purple-500 to-indigo-600" },
  { icon: Map,          title: "Smart Room Allocation",     desc: "Priority-based algorithm auto-assigns rooms by year, medical needs, merit, and gender preference with waitlist promotion.", color: "from-blue-500 to-cyan-500" },
  { icon: Users,        title: "Profile Management APIs",   desc: "Full CRUD APIs to create, view, and update student profiles and roommate preferences — with validation and partial-save support.", color: "from-violet-500 to-purple-600" },
  { icon: BarChart3,    title: "Allocation Status Tracking",desc: "Track room availability, active allocations, vacate events, transfers, and assigned roommates in real time with live occupancy stats.", color: "from-pink-500 to-rose-500" },
  { icon: MessageSquare,title: "Real-Time Chat",            desc: "Socket.IO powered chat with typing indicators, message reactions, and instant notifications.", color: "from-green-500 to-teal-500" },
  { icon: QrCode,       title: "QR Gate Pass",              desc: "Secure QR-based visitor passes, gate access, and attendance tracking for campus security.", color: "from-orange-500 to-red-500" },
  { icon: Shield,       title: "Enterprise Security",       desc: "JWT auth, RBAC, rate limiting, XSS protection, MongoDB sanitization, input validation, and comprehensive audit logs.", color: "from-slate-600 to-slate-800" },
  { icon: CreditCard,   title: "Online Payments",           desc: "Integrated fee collection with receipt generation, payment history, and overdue reminders.", color: "from-emerald-500 to-green-600" },
];

const stats = [
  { value: "2,400+", label: "Students Managed" },
  { value: "600+",   label: "Hostel Rooms" },
  { value: "35+",    label: "REST API Endpoints" },
  { value: "20+",    label: "Lifestyle Parameters" },
];

const milestones = [
  { emoji: "✅", label: "Admin Management APIs" },
  { emoji: "✅", label: "Room Status & Occupancy Tracking" },
  { emoji: "✅", label: "Allocation & Matching Integration" },
  { emoji: "✅", label: "Roommate Compatibility Algorithm" },
  { emoji: "✅", label: "Profile Management APIs (CRUD)" },
  { emoji: "✅", label: "Allocation Status Management" },
  { emoji: "✅", label: "Backend Testing & Error Handling" },
  { emoji: "✅", label: "JWT Auth & RBAC" },
  { emoji: "✅", label: "Real-time Chat (Socket.IO)" },
  { emoji: "✅", label: "Input Validation (express-validator)" },
];

const modules = [
  "🤖 AI Compatibility Engine", "🏠 Smart Allocation", "💬 Real-time Chat",
  "📱 QR Gate Pass", "📊 Analytics Dashboard", "💳 Online Payments",
  "🔔 Push Notifications", "🗺️ Interactive Hostel Map", "📋 Complaint Kanban",
  "🛒 Student Marketplace", "🔍 Lost & Found Portal", "🏆 Rewards System",
  "🚨 Emergency SOS", "📅 Leave Management", "🧺 Laundry Booking",
  "🍽️ Mess Management", "🎪 Events Module", "📄 Document Verification",
];

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black">B</span>
            </div>
            <div>
              <p className="font-bold font-display text-light-text dark:text-dark-text leading-none">BIT Hostel</p>
              <p className="text-xs text-light-muted dark:text-dark-muted">Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn btn-ghost btn-sm text-light-text dark:text-dark-text">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register Free →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="gradient-hero min-h-screen flex items-center justify-center relative overflow-hidden pt-24 pb-16">
        {/* Background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-cyan-600/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs sm:text-sm font-medium"
          >
            <Sparkles size={14} className="text-yellow-400" />
            AI Compatibility Engine • Smart Allocation • Real-time Chat
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black font-display leading-[1.1] mb-5 tracking-tight"
          >
            BIT Hostel <span className="gradient-text">Management</span> Portal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8 font-normal leading-relaxed"
          >
            Next-generation campus accommodation platform for Bannari Amman Institute of Technology.
            Featuring AI roommate matching, instant room allocation, QR gate passes, and complete student lifestyle services.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3.5 justify-center mb-10"
          >
            <Link
              to="/login"
              className="btn btn-xl shadow-lg hover:shadow-blue-500/30 transition-all"
              style={{ background: "#ffffff", color: "#1e3a8a", fontWeight: 800 }}
            >
              Sign In to Portal →
            </Link>
            <Link
              to="/register"
              className="btn btn-xl glass border-white/30 text-white hover:bg-white/10 font-bold"
            >
              🎓 Student Registration
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-3.5 text-center border border-white/15 backdrop-blur-md">
                <p className="text-2xl sm:text-3xl font-black font-display text-white">{s.value}</p>
                <p className="text-white/70 text-xs sm:text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Marquee Module List ──────────────────────── */}
      <div className="bg-blue-600 py-3 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...modules, ...modules].map((m, i) => (
            <span key={i} className="text-white/80 text-sm font-medium flex-shrink-0">{m}</span>
          ))}
        </motion.div>
      </div>

      {/* ── Features ─────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black font-display text-light-text dark:text-dark-text mb-4"
          >
            Everything You Need
          </motion.h2>
          <p className="text-light-muted dark:text-dark-muted text-lg max-w-2xl mx-auto">
            Built with industry-standard technology and best practices for real-world hostel management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card card-hover group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="font-bold text-light-text dark:text-dark-text mb-2 font-display">{f.title}</h3>
              <p className="text-light-muted dark:text-dark-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────── */}
      <section className="py-16 px-6 bg-light-surface dark:bg-dark-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black font-display text-light-text dark:text-dark-text mb-8">Built With Production-Grade Technology</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["React.js", "Vite", "Tailwind CSS", "Framer Motion", "Node.js", "Express.js",
              "MongoDB", "Mongoose", "Socket.IO", "Redux Toolkit", "JWT Auth", "RBAC",
              "React Query", "Recharts", "Swagger API", "express-validator", "Cloudinary"].map((t) => (
              <span key={t} className="badge badge-info px-3 py-1.5 text-sm">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Completed Milestones ──────────────────────── */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black font-display text-light-text dark:text-dark-text mb-2">
            Development Milestones
          </h2>
          <p className="text-light-muted dark:text-dark-muted">
            Features implemented, integration-tested, and validated end-to-end.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card flex items-center gap-3"
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="font-semibold text-sm text-light-text dark:text-dark-text">{m.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto gradient-primary rounded-3xl p-12 text-center text-white"
        >
          <Star size={40} className="text-yellow-300 mx-auto mb-4" />
          <h2 className="text-4xl font-black font-display mb-4">Ready to Join?</h2>
          <p className="text-white/70 text-lg mb-8">
            Register your BIT hostel account and experience the future of hostel management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-xl bg-white text-blue-700 hover:bg-blue-50">
              Register as Student <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-xl glass border-white/30">
              Already a member?
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="bg-dark-bg text-dark-muted py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} BIT Hostel Management System</p>
        <p className="mt-1">Bannari Amman Institute of Technology, Sathy — Built with ❤️ for students</p>
      </footer>
    </div>
  );
};

export default LandingPage;
