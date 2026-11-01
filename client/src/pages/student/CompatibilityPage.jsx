/**
 * @file CompatibilityPage.jsx
 * @description AI Roommate Compatibility Engine UI —
 * profile setup, score display, and recommendations list.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sliders, RefreshCw, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 96 }) => {
  const r      = size * 0.42;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color  = score >= 85 ? "#22c55e" : score >= 70 ? "#3b82f6" : score >= 50 ? "#eab308" : "#ef4444";
  const label  = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Poor";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-light-border dark:text-dark-border" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-xl font-black" style={{ color }}>{score}%</span>
        <span className="text-xs text-light-muted dark:text-dark-muted">{label}</span>
      </div>
    </div>
  );
};

// ─── Roommate Card ────────────────────────────────────────────────────────────
const RoommateCard = ({ match, index }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { student, score, matchReasons, conflictReasons, suggestions } = match;

  const startChat = async () => {
    try {
      const { data } = await api.post("/chat/rooms/dm", { targetUserId: student.user._id });
      navigate(`/chat/${data.data._id}`);
    } catch {
      toast.error("Failed to start chat");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card"
    >
      <div className="flex items-center gap-4">
        {/* Score Ring */}
        <ScoreRing score={score} size={80} />

        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-light-text dark:text-dark-text truncate">{student.user?.name}</p>
              <p className="text-sm text-light-muted dark:text-dark-muted">{student.department} • Year {student.year}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={startChat} className="btn btn-sm btn-secondary">
                <MessageSquare size={14} /> Chat
              </button>
              <button onClick={() => setExpanded((p) => !p)} className="btn btn-sm btn-ghost">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Match reasons preview */}
          <div className="flex flex-wrap gap-1 mt-2">
            {matchReasons?.slice(0, 2).map((r, i) => (
              <span key={i} className="badge badge-success text-xs">{r}</span>
            ))}
            {conflictReasons?.length > 0 && (
              <span className="badge badge-warning text-xs">{conflictReasons[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-light-border dark:border-dark-border overflow-hidden"
          >
            {matchReasons?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-green-600 mb-1">WHY YOU MATCH</p>
                <div className="space-y-1">
                  {matchReasons.map((r, i) => (
                    <p key={i} className="text-sm text-green-700 dark:text-green-400">{r}</p>
                  ))}
                </div>
              </div>
            )}
            {conflictReasons?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-yellow-600 mb-1">POTENTIAL CONFLICTS</p>
                <div className="space-y-1">
                  {conflictReasons.map((r, i) => (
                    <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">{r}</p>
                  ))}
                </div>
              </div>
            )}
            {suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">AI SUGGESTIONS</p>
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <p key={i} className="text-sm text-blue-700 dark:text-blue-400">💡 {s}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Profile Setup Form ───────────────────────────────────────────────────────
const ProfileSetup = ({ onComplete }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    sleepTime: "", wakeTime: "", studyHabit: "", cleanlinessLevel: 3,
    foodPreference: "", noiseTolerance: 3, introvertExtrovert: 3,
    smoking: "no", drinking: "no", roomTemperature: "moderate",
    sportsInterest: false, gamingInterest: false, readingHabit: false, fitnessInterest: false,
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post("/compatibility/profile", data),
    onSuccess: () => {
      toast.success("Compatibility profile saved! Finding your matches...");
      queryClient.invalidateQueries(["compatibility"]);
      onComplete?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save profile"),
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const SliderField = ({ label, field, min = 1, max = 5, low, high }) => (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-light-text dark:text-dark-text">{label}</span>
        <span className="text-blue-500 font-bold">{form[field]}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={form[field]}
        onChange={(e) => set(field, parseInt(e.target.value))}
        className="w-full accent-blue-600" />
      <div className="flex justify-between text-xs text-light-muted dark:text-dark-muted">
        <span>{low}</span><span>{high}</span>
      </div>
    </div>
  );

  const SelectField = ({ label, field, options }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-light-text dark:text-dark-text">{label}</label>
      <select value={form[field]} onChange={(e) => set(field, e.target.value)} className="input">
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
          <Sliders size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg font-display text-light-text dark:text-dark-text">Lifestyle Profile Setup</h2>
          <p className="text-sm text-light-muted dark:text-dark-muted">Help us find your ideal roommate</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Sleep Time" field="sleepTime" options={[
            { value: "before_9pm", label: "Before 9 PM" },
            { value: "9pm_11pm",   label: "9 PM – 11 PM" },
            { value: "11pm_1am",   label: "11 PM – 1 AM" },
            { value: "after_1am",  label: "After 1 AM" },
          ]} />
          <SelectField label="Wake Time" field="wakeTime" options={[
            { value: "before_5am", label: "Before 5 AM" },
            { value: "5am_7am",    label: "5 AM – 7 AM" },
            { value: "7am_9am",    label: "7 AM – 9 AM" },
            { value: "after_9am",  label: "After 9 AM" },
          ]} />
          <SelectField label="Study Habit" field="studyHabit" options={[
            { value: "early_morning", label: "Early Morning" },
            { value: "daytime",       label: "Daytime" },
            { value: "evening",       label: "Evening" },
            { value: "night_owl",     label: "Night Owl" },
          ]} />
          <SelectField label="Food Preference" field="foodPreference" options={[
            { value: "vegetarian",    label: "Vegetarian" },
            { value: "non_vegetarian",label: "Non-Vegetarian" },
            { value: "vegan",         label: "Vegan" },
            { value: "eggetarian",    label: "Eggetarian" },
          ]} />
          <SelectField label="Smoking" field="smoking" options={[
            { value: "no", label: "Non-Smoker" }, { value: "occasionally", label: "Occasionally" }, { value: "yes", label: "Yes" },
          ]} />
          <SelectField label="Drinking" field="drinking" options={[
            { value: "no", label: "Non-Drinker" }, { value: "occasionally", label: "Occasionally" }, { value: "yes", label: "Yes" },
          ]} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderField label="Cleanliness Level" field="cleanlinessLevel" low="Messy" high="Very Clean" />
          <SliderField label="Noise Tolerance" field="noiseTolerance" low="Need Silence" high="Noise OK" />
          <SliderField label="Introvert / Extrovert" field="introvertExtrovert" low="Introvert" high="Extrovert" />
        </div>

        {/* Interests */}
        <div>
          <p className="text-sm font-medium text-light-text dark:text-dark-text mb-2">Interests</p>
          <div className="flex flex-wrap gap-3">
            {[
              ["sportsInterest", "⚽ Sports"], ["gamingInterest", "🎮 Gaming"],
              ["readingHabit", "📚 Reading"], ["fitnessInterest", "💪 Fitness"],
            ].map(([field, label]) => (
              <button key={field} type="button"
                onClick={() => set(field, !form[field])}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                  form[field]
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-600"
                    : "border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending || !form.sleepTime || !form.foodPreference}
          className="btn btn-primary w-full btn-lg"
        >
          {mutation.isPending ? <div className="spinner" /> : <><Star size={18} /> Find My Matches</>}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CompatibilityPage = () => {
  const [showSetup, setShowSetup] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["compat-profile"],
    queryFn:  async () => { const { data } = await api.get("/compatibility/profile"); return data.data; },
  });

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ["compatibility"],
    queryFn:  async () => { const { data } = await api.get("/compatibility/recommendations?limit=20"); return data.data; },
    enabled:  !!profile?.isComplete,
  });

  if (!profile?.isComplete || showSetup) {
    return (
      <div className="py-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text mb-2">🤖 AI Roommate Finder</h1>
          <p className="text-light-muted dark:text-dark-muted">Set up your lifestyle profile to discover compatible roommates</p>
        </div>
        <ProfileSetup onComplete={() => setShowSetup(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text">🤖 AI Roommate Finder</h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            {recommendations?.length || 0} compatible students found
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSetup(true)} className="btn btn-secondary btn-sm">
            <Sliders size={14} /> Edit Profile
          </button>
          <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Top Match Banner */}
      {recommendations?.[0] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gradient-primary rounded-2xl p-6 text-white flex items-center gap-6"
        >
          <ScoreRing score={recommendations[0].score} size={100} />
          <div>
            <p className="text-white/70 text-sm">🏆 Best Match</p>
            <h2 className="text-2xl font-black font-display">{recommendations[0].student?.user?.name}</h2>
            <p className="text-white/70">{recommendations[0].student?.department} • Year {recommendations[0].student?.year}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {recommendations[0].matchReasons?.slice(0, 3).map((r, i) => (
                <span key={i} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{r}</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
        ) : (
          recommendations?.map((match, i) => (
            <RoommateCard key={match.student._id} match={match} index={i} />
          ))
        )}
      </div>
    </div>
  );
};

export default CompatibilityPage;
