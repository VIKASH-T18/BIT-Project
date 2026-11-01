/**
 * @file Topbar.jsx
 * @description Top navigation bar with breadcrumb, search, notifications, theme toggle, and user menu.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Bell, Sun, Moon, ChevronRight,
  LogOut, User, Settings
} from "lucide-react";

import {
  toggleTheme, selectTheme, toggleMobileSidebar,
  selectSidebarPinned, selectSidebarHoverOpen, setSidebarHoverOpen
} from "../../redux/slices/uiSlice";
import { selectCurrentUser, logoutUser } from "../../redux/slices/authSlice";
import { selectCurrentUser as selectUser } from "../../redux/slices/authSlice";
import { markAllAsRead } from "../../redux/slices/notificationSlice";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useQuery } from "@tanstack/react-query";

// ─── Breadcrumb Generator ─────────────────────────────────────────────────────
const generateBreadcrumbs = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    path:  "/" + parts.slice(0, index + 1).join("/"),
  }));
};

const Topbar = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = useSelector(selectCurrentUser);
  const theme       = useSelector(selectTheme);
  const isPinned    = useSelector(selectSidebarPinned);
  const isHoverOpen = useSelector(selectSidebarHoverOpen);

  const [notifOpen, setNotifOpen]           = useState(false);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const notifRef  = useRef(null);
  const userRef   = useRef(null);

  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Fetch notifications count
  const { data: notifData } = useQuery({
    queryKey:  ["notifications-count"],
    queryFn:   async () => {
      const { data } = await api.get("/notifications?limit=5&unreadOnly=true");
      return data.data;
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = notifData?.unreadCount || 0;
  const recentNotifs = notifData?.notifications || [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))   setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Logged out");
    navigate("/login");
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      dispatch(markAllAsRead());
      toast.success("All notifications marked as read");
    } catch {}
  };

  return (
    <header className="h-20 flex items-center justify-between gap-4 px-6 md:px-10 border-b border-light-border dark:border-dark-border bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md shrink-0 z-30 transition-all">
      {/* ── Left Side: Menu + Breadcrumbs ────────────────── */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              dispatch(toggleMobileSidebar());
            } else {
              dispatch(setSidebarHoverOpen(!isHoverOpen));
            }
          }}
          className={`p-2.5 rounded-xl hover:bg-light-elevated dark:hover:bg-dark-elevated text-light-muted dark:text-dark-muted transition-colors ${
            isPinned ? "lg:hidden" : ""
          }`}
          title="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* ── Breadcrumb ────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} className="text-light-muted/60 dark:text-dark-muted/60 shrink-0" />}
              <span
                className={`truncate ${
                  i === breadcrumbs.length - 1
                    ? "text-light-text dark:text-dark-text font-bold text-base"
                    : "text-light-muted dark:text-dark-muted font-medium hover:text-light-text dark:hover:text-dark-text transition-colors"
                }`}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* ── Right Controls ────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border/80 shadow-sm transition-all duration-200 active:scale-95"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun size={19} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon size={19} className="text-indigo-400 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text bg-light-surface/80 dark:bg-dark-surface/80 hover:bg-light-elevated dark:hover:bg-dark-elevated border border-light-border dark:border-dark-border/80 shadow-sm transition-all duration-200 active:scale-95"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-sm ring-2 ring-light-surface dark:ring-dark-surface">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 card z-dropdown max-h-96 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-light-text dark:text-dark-text">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                {recentNotifs.length === 0 ? (
                  <p className="text-center text-light-muted dark:text-dark-muted py-6 text-sm">
                    No new notifications
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentNotifs.map((n) => (
                      <div
                        key={n._id}
                        className={`p-3 rounded-xl text-sm cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20" : "hover:bg-light-elevated dark:hover:bg-dark-elevated"}`}
                        onClick={() => { navigate(n.actionUrl || "/notifications"); setNotifOpen(false); }}
                      >
                        <p className="font-medium text-light-text dark:text-dark-text line-clamp-1">{n.title}</p>
                        <p className="text-light-muted dark:text-dark-muted text-xs line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { navigate("/notifications"); setNotifOpen(false); }}
                  className="w-full mt-3 text-center text-sm text-blue-500 hover:underline py-2"
                >
                  View all notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle Divider */}
        <div className="h-6 w-px bg-light-border dark:bg-dark-border/80 mx-0.5 hidden sm:block" />

        {/* User Avatar/Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((p) => !p)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors border border-transparent hover:border-light-border dark:hover:border-dark-border"
          >
            <img
              src={user?.profileUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=2563eb&color=fff`}
              alt={user?.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-bold text-light-text dark:text-dark-text leading-tight truncate max-w-[120px]">
                {user?.name?.split(" ")[0]}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {user?.role}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-52 card z-dropdown"
              >
                <div className="pb-3 mb-3 border-b border-light-border dark:border-dark-border">
                  <p className="font-semibold text-sm text-light-text dark:text-dark-text">{user?.name}</p>
                  <p className="text-xs text-light-muted dark:text-dark-muted">{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <button onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}
                    className="sidebar-link w-full">
                    <User size={16} /> Profile
                  </button>
                  <button onClick={() => { navigate("/profile?tab=settings"); setUserMenuOpen(false); }}
                    className="sidebar-link w-full">
                    <Settings size={16} /> Settings
                  </button>
                  <button onClick={handleLogout}
                    className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
