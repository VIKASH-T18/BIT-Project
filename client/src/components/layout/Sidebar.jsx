/**
 * @file Sidebar.jsx
 * @description Role-aware navigation sidebar supporting edge cursor hover auto-reveal,
 * pinning, and smooth glassmorphism styling.
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, User, Home, Star, MessageSquare, Bell, AlertTriangle,
  Calendar, Users, Settings, LogOut, ChevronLeft, ChevronRight,
  CreditCard, Map, FileText, ShoppingBag, Search, Utensils,
  Shirt, ClipboardList, UserCheck, Building, DollarSign,
  BarChart3, BookOpen, Shield, CheckSquare, Megaphone, Pin, PinOff
} from "lucide-react";

import { selectCurrentUser, logoutUser } from "../../redux/slices/authSlice";
import {
  selectSidebarOpen, toggleSidebar,
  selectSidebarPinned, toggleSidebarPinned,
  selectSidebarHoverOpen, setSidebarHoverOpen,
  selectSidebarMobile, setSidebarMobile
} from "../../redux/slices/uiSlice";
import toast from "react-hot-toast";

// ─── Navigation Config (per role) ────────────────────────────────────────────

// Section-grouped navigation for better information architecture
const studentNavGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",     to: "/student/dashboard" },
    ],
  },
  {
    label: "Accommodation",
    items: [
      { icon: Home,        label: "Apply Hostel",  to: "/student/application" },
      { icon: CheckSquare, label: "My Allocation", to: "/student/allocation" },
      { icon: Star,        label: "AI Roommate",   to: "/student/compatibility", badge: "AI" },
    ],
  },
  {
    label: "Campus Life",
    items: [
      { icon: MessageSquare, label: "Chat",         to: "/chat" },
      { icon: Calendar,      label: "Leave Request", to: "/student/leave" },
      { icon: Users,         label: "Visitors",     to: "/student/visitors" },
      { icon: AlertTriangle, label: "Complaints",   to: "/student/complaints" },
      { icon: Utensils,      label: "Mess Menu",    to: "/student/mess" },
      { icon: Shirt,         label: "Laundry",      to: "/student/laundry" },
    ],
  },
  {
    label: "Explore",
    items: [
      { icon: ShoppingBag, label: "Marketplace",  to: "/student/marketplace" },
      { icon: Search,      label: "Lost & Found", to: "/student/lost-found" },
      { icon: BookOpen,    label: "Notices",      to: "/notices" },
      { icon: Calendar,    label: "Events",       to: "/events" },
      { icon: Map,         label: "Hostel Map",   to: "/hostel-map" },
    ],
  },
];

const wardenNavGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",   to: "/warden/dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: UserCheck,     label: "Approvals",    to: "/warden/approvals" },
      { icon: Home,          label: "Allocations",  to: "/warden/allocation" },
      { icon: AlertTriangle, label: "Complaints",   to: "/warden/complaints" },
      { icon: Calendar,      label: "Leave",        to: "/warden/leave" },
      { icon: Users,         label: "Visitors",     to: "/warden/visitors" },
      { icon: Utensils,      label: "Mess Menu",    to: "/warden/mess-menu" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Megaphone,     label: "Notices",      to: "/warden/notices" },
      { icon: MessageSquare, label: "Chat",         to: "/chat" },
      { icon: Map,           label: "Hostel Map",   to: "/hostel-map" },
    ],
  },
];

const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",  to: "/admin/dashboard" },
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: UserCheck, label: "Approvals", to: "/admin/approvals" },
      { icon: Users,     label: "Students",    to: "/admin/students" },
      { icon: Shield,    label: "Wardens",     to: "/admin/wardens" },
      { icon: Building,  label: "Rooms",       to: "/admin/rooms" },
      { icon: DollarSign,label: "Fees",        to: "/admin/fees" },
      { icon: Utensils,  label: "Mess Menu",   to: "/admin/mess-menu" },
    ],
  },
  {
    label: "Reports & Info",
    items: [
      { icon: BookOpen,  label: "Notices",     to: "/notices" },
      { icon: FileText,  label: "Reports",     to: "/admin/reports" },
      { icon: Settings,  label: "Settings",    to: "/admin/settings" },
    ],
  },
];

// Flatten groups into a plain list for backward compat (mobile / collapsed views)
const studentNav  = studentNavGroups.flatMap((g) => g.items);
const wardenNav   = wardenNavGroups.flatMap((g) => g.items);
const adminNav    = adminNavGroups.flatMap((g) => g.items);

const navGroupsByRole = { student: studentNavGroups, warden: wardenNavGroups, admin: adminNavGroups };
const navByRole       = { student: studentNav,       warden: wardenNav,       admin: adminNav };

// ─── NavItem Component ────────────────────────────────────────────────────────

const NavItem = ({ icon: Icon, label, to, badge, collapsed, onLinkClick }) => (
  <NavLink
    to={to}
    onClick={onLinkClick}
    className={({ isActive }) =>
      `sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""}`
    }
    title={collapsed ? label : undefined}
  >
    <Icon size={18} className="shrink-0" />
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="flex-1 whitespace-nowrap overflow-hidden text-xs font-semibold"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {badge && !collapsed && (
      <span className="badge badge-info text-[10px] px-1.5 py-0.5">{badge}</span>
    )}
  </NavLink>
);

// ─── Sidebar Component ────────────────────────────────────────────────────────

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const isPinned = useSelector(selectSidebarPinned);
  const isHoverOpen = useSelector(selectSidebarHoverOpen);
  const sidebarMobile = useSelector(selectSidebarMobile);

  const navItems  = navByRole[user?.role]       || studentNav;
  const navGroups = navGroupsByRole[user?.role] || studentNavGroups;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // Ignored
    }
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleLinkClick = () => {
    dispatch(setSidebarMobile(false));
    if (!isPinned) {
      dispatch(setSidebarHoverOpen(false));
    }
  };

  const collapsed = !sidebarOpen && isPinned;

  return (
    <motion.aside
      onMouseLeave={() => {
        if (!isPinned) dispatch(setSidebarHoverOpen(false));
      }}
      initial={false}
      animate={{
        width: isPinned ? (collapsed ? 72 : 280) : 280,
        x: sidebarMobile ? 0 : (isPinned || isHoverOpen ? 0 : -290),
        opacity: sidebarMobile || isPinned || isHoverOpen ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={`flex flex-col h-full border-r border-light-border dark:border-dark-border bg-light-surface/95 dark:bg-dark-surface/95 backdrop-blur-xl overflow-hidden shrink-0 z-50 ${
        sidebarMobile
          ? "fixed left-0 top-0 bottom-0 shadow-2xl"
          : isPinned
          ? "hidden lg:flex lg:relative"
          : "fixed left-0 top-0 bottom-0 shadow-2xl"
      }`}
      style={{ width: isPinned ? (collapsed ? 72 : 280) : 280 }}
    >
      {/* ── Header ──────────────────────────────────── */}
      <div
        className={`flex items-center p-5 border-b border-light-border dark:border-dark-border ${
          collapsed ? "justify-center" : "gap-3.5"
        }`}
      >
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0 shadow-md">
          <span className="text-white font-black text-lg">B</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden flex-1"
            >
              <p className="font-extrabold text-base font-display text-light-text dark:text-dark-text leading-tight">
                BIT Hostel
              </p>
              <p className="text-xs text-light-muted dark:text-dark-muted capitalize font-medium">
                {user?.role} Portal
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pin / Auto-Hide Mode Toggle */}
        <button
          onClick={() => dispatch(toggleSidebarPinned())}
          className={`p-1.5 rounded-lg border transition-all ${
            isPinned
              ? "bg-primary-500/10 text-primary-500 border-primary-500/20"
              : "text-light-muted hover:text-primary-500 border-light-border dark:border-dark-border"
          }`}
          title={isPinned ? "Unpin sidebar (Auto-hide on edge cursor)" : "Pin sidebar permanently"}
        >
          {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>

        {isPinned && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 rounded-lg hover:bg-light-elevated dark:hover:bg-dark-elevated text-light-muted dark:text-dark-muted transition-colors"
            aria-label="Toggle collapse"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* ── Mode Hint / User Info ────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pt-3">
          {!isPinned && (
            <div className="mb-2 px-2.5 py-1 rounded-lg bg-primary-500/5 border border-primary-500/15 flex items-center justify-between text-[10px] text-primary-600 font-semibold">
              <span>Auto-Hide Mode</span>
              <span className="text-[9px] opacity-75">Moves on edge</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center gap-2.5">
            <img
              src={
                user?.profileUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || "U"
                )}&background=2563eb&color=fff`
              }
              alt={user?.name}
              className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm"
            />
            <div className="overflow-hidden min-w-0">
              <p className="font-semibold text-xs text-light-text dark:text-dark-text truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-blue-500 font-bold capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Items ─────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
        {collapsed ? (
          // Collapsed: flat icon-only list, no group headers
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                collapsed={collapsed}
                onLinkClick={handleLinkClick}
              />
            ))}
          </div>
        ) : (
          // Expanded: grouped with section headers
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-light-muted/70 dark:text-dark-muted/60 select-none">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.to}
                      {...item}
                      collapsed={false}
                      onLinkClick={handleLinkClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="p-3 border-t border-light-border dark:border-dark-border space-y-1 bg-light-surface/50 dark:bg-dark-surface/50">
        <NavItem
          icon={Bell}
          label="Notifications"
          to="/notifications"
          collapsed={collapsed}
          onLinkClick={handleLinkClick}
        />
        <NavItem
          icon={Settings}
          label="Profile & Settings"
          to="/profile"
          collapsed={collapsed}
          onLinkClick={handleLinkClick}
        />
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-rose-500 hover:bg-rose-500/10 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-xs font-semibold ml-2">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
