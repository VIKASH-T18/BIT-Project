/**
 * @file NotificationsPage.jsx
 * @description User notifications center — view alerts, updates, room announcements, and mark as read.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell, CheckCheck, Trash2, CheckCircle2, AlertTriangle,
  Info, Clock, RefreshCw
} from "lucide-react";
import api from "../../services/api";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  // Fetch notifications
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data?.data || { notifications: [], total: 0, unreadCount: 0 };
    },
  });

  const notifications = data?.notifications || (Array.isArray(data) ? data : []);

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/notifications/read-all");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-notifs"]);
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["unread-notifs"]);
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/notifications/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <Bell className="w-8 h-8" />
            </span>
            Notifications
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            Stay updated with your room status, fee dues, notices, and hostel alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface text-light-muted hover:text-light-text"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-2 flex items-center gap-2 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-primary-500 text-white shadow-sm"
              : "text-light-muted hover:text-light-text"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === "unread"
              ? "bg-primary-500 text-white shadow-sm"
              : "text-light-muted hover:text-light-text"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden divide-y divide-light-border dark:divide-dark-border">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-light-muted dark:text-dark-muted">
            Loading notifications...
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 text-primary-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
              All Caught Up!
            </h3>
            <p className="text-light-muted dark:text-dark-muted text-sm max-w-sm mx-auto">
              You don't have any unread notifications right now.
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markReadMutation.mutate(notif._id)}
              className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                !notif.isRead
                  ? "bg-primary-500/5 hover:bg-primary-500/10"
                  : "hover:bg-light-surface dark:hover:bg-dark-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === "alert"
                      ? "bg-rose-500/10 text-rose-500"
                      : notif.type === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-primary-500/10 text-primary-500"
                  }`}
                >
                  {notif.type === "alert" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : notif.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-light-text dark:text-dark-text">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-light-muted dark:text-dark-muted mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(notif._id);
                }}
                className="text-light-muted hover:text-rose-500 p-1.5 transition-colors"
                title="Dismiss"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
