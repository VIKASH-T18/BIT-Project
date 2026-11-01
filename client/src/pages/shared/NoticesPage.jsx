/**
 * @file NoticesPage.jsx
 * @description Official Hostel Notice Board — view announcements, filter by priority/category,
 * and publish new broadcasts (Admin/Warden).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Pin, Heart, Eye, Plus, Search, Filter, Trash2,
  AlertTriangle, Calendar, User, X, CheckCircle2, Megaphone
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All Notices" },
  { id: "urgent", label: "Urgent" },
  { id: "general", label: "General" },
  { id: "fees", label: "Fees" },
  { id: "academic", label: "Academic" },
  { id: "maintenance", label: "Maintenance" },
  { id: "events", label: "Events" },
  { id: "rules", label: "Rules" },
];

const NoticesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canPublish = user?.role === "admin" || user?.role === "warden";

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New notice form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "normal",
    isPinned: false,
  });
  const [formError, setFormError] = useState("");

  // Fetch notices
  const { data: notices = [], isLoading, refetch } = useQuery({
    queryKey: ["notices", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get("/notices", { params });
      return res.data?.data || [];
    },
  });

  // Create notice mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/notices", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notices"]);
      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        content: "",
        category: "general",
        priority: "normal",
        isPinned: false,
      });
      setFormError("");
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || "Failed to publish notice.");
    },
  });

  // Pin mutation
  const pinMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/notices/${id}/pin`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["notices"]),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/notices/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["notices"]),
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/notices/${id}/like`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["notices"]),
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <Megaphone className="w-8 h-8" />
            </span>
            Hostel Notice Board
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            Official announcements, institutional updates, and urgent alerts from the hostel office.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
        </div>
      </div>

      {/* Notice Feed */}
      {isLoading ? (
        <div className="card py-16 text-center text-light-muted dark:text-dark-muted">
          <p className="text-sm">Loading announcements...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 text-primary-500">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
            No Notices Published
          </h3>
          <p className="text-light-muted dark:text-dark-muted text-sm max-w-sm mx-auto">
            There are currently no active notices in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <motion.div
              key={notice._id}
              layout
              className={`card p-6 flex flex-col justify-between transition-all hover:shadow-md ${
                notice.isPinned
                  ? "border-primary-500/40 bg-gradient-to-br from-primary-500/5 to-transparent"
                  : ""
              }`}
            >
              <div>
                {/* Header metadata */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notice.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary-500 text-white">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        notice.priority === "urgent"
                          ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          : "bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted border border-light-border dark:border-dark-border"
                      }`}
                    >
                      {notice.category}
                    </span>
                  </div>

                  {canPublish && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => pinMutation.mutate(notice._id)}
                        className={`p-1.5 rounded-lg border border-light-border dark:border-dark-border transition-colors ${
                          notice.isPinned ? "text-primary-500" : "text-light-muted hover:text-primary-500"
                        }`}
                        title={notice.isPinned ? "Unpin notice" : "Pin notice to top"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this notice?")) {
                            deleteMutation.mutate(notice._id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-light-border dark:border-dark-border text-light-muted hover:text-rose-500 transition-colors"
                        title="Delete notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Content */}
                <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-2 line-clamp-2">
                  {notice.title}
                </h3>
                <p className="text-light-muted dark:text-dark-muted text-sm whitespace-pre-line mb-6 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-light-border dark:border-dark-border flex items-center justify-between text-xs text-light-muted dark:text-dark-muted">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {notice.author?.name || "Hostel Warden"}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => likeMutation.mutate(notice._id)}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        (notice.likes || []).includes(user?._id) ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                    <span>{notice.likes?.length || 0}</span>
                  </button>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{notice.views || 0}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Notice Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-light-muted hover:text-light-text dark:hover:text-dark-text"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-1">
                Publish New Announcement
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted mb-4">
                Broadcast official updates to hostel residents.
              </p>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                    Notice Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Mandatory Hostel Floor Meeting"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    >
                      <option value="general">General</option>
                      <option value="urgent">Urgent</option>
                      <option value="fees">Fees</option>
                      <option value="academic">Academic</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="events">Events</option>
                      <option value="rules">Rules</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                    Notice Content
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Type notice body..."
                    className="w-full p-3 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-light-text dark:text-dark-text">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 accent-primary-500 rounded"
                  />
                  Pin this notice to the top of the feed
                </label>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    {createMutation.isPending ? "Publishing..." : "Publish Broadcast"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NoticesPage;
