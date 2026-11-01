/**
 * @file LostFoundPage.jsx
 * @description Campus & Hostel Lost and Found Bulletin with instant item reporting,
 * category filters, location tags, and verified claim actions.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, MapPin, Calendar, CheckCircle2,
  AlertCircle, Phone, X, Tag, Laptop, Key, CreditCard,
  Book, Shirt, Package, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = {
  electronics: { label: "Electronics", icon: Laptop },
  id_cards:    { label: "ID Cards & Passes", icon: CreditCard },
  keys:        { label: "Keys", icon: Key },
  books:       { label: "Books & Notes", icon: Book },
  clothing:    { label: "Clothing & Gear", icon: Shirt },
  other:       { label: "General Items", icon: Package },
};

const LostFoundPage = () => {
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState("all"); // "all" | "lost" | "found"
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "found",
    category: "electronics",
    location: "",
    description: "",
    contact: "+91 98765 43212",
  });

  const handleReport = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      toast.error("Please fill in item title and location.");
      return;
    }
    const newItem = {
      id: `LF-${Math.floor(100 + Math.random() * 899)}`,
      ...formData,
      date: "Just now",
      finder: "Arjun Kumar",
    };
    setItems([newItem, ...items]);
    toast.success(`Reported item: ${formData.title}!`);
    setIsModalOpen(false);
    setFormData({
      title: "",
      type: "found",
      category: "electronics",
      location: "",
      description: "",
      contact: "+91 98765 43212",
    });
  };

  const filtered = items.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
              Hostel Bulletin Board
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Verified Campus Lost & Found</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Lost & Found
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Report misplaced belongings, browse recovered items, and claim lost properties.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-700/25 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Report Item</span>
        </button>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-light-border dark:border-dark-border/60">
          {[
            { id: "all", label: "All Items" },
            { id: "found", label: "Found Items" },
            { id: "lost", label: "Lost Items" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
          <input
            type="text"
            placeholder="Search lost or found items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* ── Items Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const cat = CATEGORIES[item.category] || CATEGORIES.other;
          const CatIcon = cat.icon;
          const isFound = item.type === "found";

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 space-y-3.5 hover:border-violet-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center flex-shrink-0">
                      <CatIcon size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-violet-400">{item.id}</span>
                      <p className="text-xs font-semibold text-light-muted dark:text-dark-muted">{cat.label}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isFound ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                    "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                  }`}>
                    {item.type}
                  </span>
                </div>

                <h3 className="font-bold text-base text-light-text dark:text-dark-text leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2">
                  {item.description}
                </p>

                <div className="p-2.5 rounded-xl bg-light-elevated/40 dark:bg-dark-elevated/40 border border-light-border dark:border-dark-border/40 text-xs space-y-1">
                  <p className="flex items-center gap-1.5 text-light-text dark:text-dark-text">
                    <MapPin size={13} className="text-rose-400" />
                    <span className="font-semibold">{item.location}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-light-muted dark:text-dark-muted text-[11px]">
                    <Calendar size={13} className="text-violet-400" />
                    <span>Reported: {item.date}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-light-border dark:border-dark-border/60 flex items-center justify-between">
                <span className="text-xs text-light-muted dark:text-dark-muted">Contact: {item.contact}</span>
                <button
                  onClick={() => toast.success(`Claim submitted for ${item.title}! Security desk notified.`)}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-500 shadow-sm transition-all"
                >
                  {isFound ? "Claim Item" : "Found This"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Modal: Report Item ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl card p-6 bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white font-display">Report Lost or Found Item</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReport} className="space-y-3.5">
                <div>
                  <label className="font-bold block mb-1">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "found" })}
                      className={`p-2 rounded-xl font-bold border transition-all ${
                        formData.type === "found" ? "bg-emerald-600/20 border-emerald-500 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      I Found an Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "lost" })}
                      className={`p-2 rounded-xl font-bold border transition-all ${
                        formData.type === "lost" ? "bg-rose-600/20 border-rose-500 text-rose-400" : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      I Lost an Item
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Item Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Titan Water Bottle"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="electronics">Electronics</option>
                      <option value="id_cards">ID & Passes</option>
                      <option value="keys">Keys</option>
                      <option value="books">Books & Notes</option>
                      <option value="clothing">Clothing</option>
                      <option value="other">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Location Found/Lost</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A Library"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Description / Distinguishing Marks</label>
                  <textarea
                    rows={2}
                    placeholder="Describe color, brand, stickers, or specific condition..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-500 shadow-md transition-all"
                >
                  Publish to Bulletin
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LostFoundPage;
