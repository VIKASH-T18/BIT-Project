/**
 * @file DashboardLayout.jsx
 * @description Main dashboard layout with left-corner edge hover cursor auto-reveal,
 * topbar, and full-width responsive content area.
 */
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import SOSButton from "../components/common/SOSButton";

import {
  selectSidebarPinned,
  selectSidebarHoverOpen,
  setSidebarHoverOpen,
  selectSidebarMobile,
  setSidebarMobile,
} from "../redux/slices/uiSlice";

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isPinned = useSelector(selectSidebarPinned);
  const isHoverOpen = useSelector(selectSidebarHoverOpen);
  const sidebarMobile = useSelector(selectSidebarMobile);
  const hoverTimeoutRef = useRef(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    dispatch(setSidebarMobile(false));
    if (!isPinned) dispatch(setSidebarHoverOpen(false));
  }, [location.pathname, isPinned, dispatch]);

  // Global mousemove detector for left corner / left edge dragging or moving
  useEffect(() => {
    if (isPinned) return;

    const handleMouseMove = (e) => {
      // If cursor is within 24px of the left edge, reveal navbar
      if (e.clientX <= 24) {
        clearTimeout(hoverTimeoutRef.current);
        dispatch(setSidebarHoverOpen(true));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPinned, dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg relative">
      {/* ── Left Edge Hover Trigger Strip (Active when not pinned) ── */}
      {!isPinned && (
        <div
          onMouseEnter={() => {
            clearTimeout(hoverTimeoutRef.current);
            dispatch(setSidebarHoverOpen(true));
          }}
          className="fixed left-0 top-0 bottom-0 w-6 z-40 group cursor-pointer"
          title="Move cursor here to reveal navigation menu"
        >
          {/* Subtle glowing pill handle */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-r-full bg-primary-500/30 group-hover:bg-primary-500 group-hover:w-3.5 transition-all duration-300 shadow-md flex items-center justify-end pr-0.5">
            <ChevronRight className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* ── Backdrop Overlay when hover-revealed on top of content ── */}
      <AnimatePresence>
        {!isPinned && isHoverOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setSidebarHoverOpen(false))}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Overlay ───────────────────────────── */}
      <AnimatePresence>
        {sidebarMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay lg:hidden z-40"
            onClick={() => dispatch(setSidebarMobile(false))}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar (Auto-hides or docks depending on pin state) ─ */}
      <Sidebar />

      {/* ── Main Content Area ────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />

        {/* Page Content with animated transitions */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12 lg:py-10">
          <div className="max-w-7xl mx-auto w-full pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Floating SOS Button ───────────────────────── */}
      <SOSButton />
    </div>
  );
};

export default DashboardLayout;
