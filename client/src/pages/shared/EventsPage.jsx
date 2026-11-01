/**
 * @file EventsPage.jsx
 * @description Campus & Hostel Events — sports tournaments, cultural nights, workshops,
 * and meeting schedules with RSVP management.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Users, Plus, Trash2, Clock, CheckCircle2,
  AlertCircle, Sparkles, X, Trophy, Music, Wrench
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const EVENT_TYPE_COLORS = {
  sports: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  cultural: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  workshop: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  meeting: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const EventsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === "admin" || user?.role === "warden";

  const [selectedType, setSelectedType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "sports",
    eventDate: "",
    location: "Hostel Ground",
    maxCapacity: "",
  });
  const [formError, setFormError] = useState("");

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", selectedType],
    queryFn: async () => {
      const params = {};
      if (selectedType !== "all") params.type = selectedType;
      const res = await api.get("/events", { params });
      return res.data?.data || [];
    },
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/events", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["events"]);
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        type: "sports",
        eventDate: "",
        location: "Hostel Ground",
        maxCapacity: "",
      });
      setFormError("");
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || "Failed to schedule event.");
    },
  });

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/events/${id}/register`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["events"]),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/events/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["events"]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.eventDate) {
      setFormError("Title and date are required.");
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <Sparkles className="w-8 h-8" />
            </span>
            Hostel Activities & Events
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            Stay active with hostel tournaments, cultural nights, tech bootcamps, and floor socials.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="card p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: "all", label: "All Events" },
          { id: "sports", label: "Sports" },
          { id: "cultural", label: "Cultural" },
          { id: "workshop", label: "Workshops" },
          { id: "meeting", label: "Meetings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedType === tab.id
                ? "bg-primary-500 text-white shadow-sm"
                : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="card py-16 text-center text-light-muted dark:text-dark-muted text-sm">
          Loading hostel calendar...
        </div>
      ) : events.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 text-primary-500">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
            No Events Scheduled
          </h3>
          <p className="text-light-muted dark:text-dark-muted text-sm max-w-sm mx-auto">
            Check back later or propose an event through your student council.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const evDate = new Date(ev.eventDate);
            const isPast = evDate < new Date();
            const regCount = ev.registrations?.length || 0;

            return (
              <motion.div
                key={ev._id}
                layout
                className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all border border-light-border dark:border-dark-border"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        EVENT_TYPE_COLORS[ev.type] || EVENT_TYPE_COLORS.other
                      }`}
                    >
                      {ev.type}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => {
                          if (confirm("Delete this event?")) deleteMutation.mutate(ev._id);
                        }}
                        className="text-light-muted hover:text-rose-500 p-1"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-2 line-clamp-2">
                    {ev.title}
                  </h3>
                  <p className="text-light-muted dark:text-dark-muted text-xs line-clamp-3 mb-4 leading-relaxed">
                    {ev.description || "No description provided."}
                  </p>

                  <div className="space-y-2 text-xs text-light-muted dark:text-dark-muted mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>
                        {evDate.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>{ev.location || "Hostel Quadrangle"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>
                        {regCount} {ev.maxCapacity ? `/ ${ev.maxCapacity}` : ""} attending
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP / Action footer */}
                <div className="pt-4 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                  <span className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                    Organized by {ev.organizer?.name || "Hostel Office"}
                  </span>

                  {user?.role === "student" && !isPast && (
                    <button
                      onClick={() => rsvpMutation.mutate(ev._id)}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      RSVP
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Schedule Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-light-muted hover:text-light-text dark:hover:text-dark-text"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-1">
                Schedule New Hostel Event
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted mb-4">
                Add an activity to the hostel calendar.
              </p>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Inter-Block Table Tennis Championship"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Event Category
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    >
                      <option value="sports">Sports</option>
                      <option value="cultural">Cultural</option>
                      <option value="workshop">Workshop</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Max Capacity (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Block B Common Room"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-light-text dark:text-dark-text mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about participation, prizes, or rules..."
                    className="w-full p-3 rounded-xl text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-light-border dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    {createMutation.isPending ? "Scheduling..." : "Schedule Event"}
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

export default EventsPage;
