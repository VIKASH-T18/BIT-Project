
/**
 * @file MarketplacePage.jsx
 * @description Peer-to-Peer Student Hostel Marketplace for trading course textbooks,
 * lab equipment, drafters, study lamps, cycles, and room essentials.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Plus, Search, Tag, MessageCircle, Heart,
  BookOpen, Compass, Sparkles, Filter, X, ArrowUpRight,
  ShieldCheck, Bike, Laptop, Coffee
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "books", label: "Textbooks & Notes" },
  { id: "lab_gear", label: "Lab Kits & Drafters" },
  { id: "appliances", label: "Room Appliances" },
  { id: "cycles", label: "Cycles & Mobility" },
];

const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "books",
    condition: "Like New",
    description: "",
  });

  const handlePost = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error("Please fill in item title and price.");
      return;
    }
    const newListing = {
      id: `MKT-${Math.floor(200 + Math.random() * 799)}`,
      title: formData.title,
      price: parseInt(formData.price),
      category: formData.category,
      condition: formData.condition,
      seller: "Arjun Kumar (CSE 3rd Yr)",
      room: "Emerald Block A - 101",
      date: "Just now",
      description: formData.description || "In clean, ready-to-use condition.",
    };
    setListings([newListing, ...listings]);
    toast.success("Item listed on hostel marketplace!");
    setIsModalOpen(false);
    setFormData({ title: "", price: "", category: "books", condition: "Like New", description: "" });
  };

  const filtered = listings.filter((item) => {
    const matchesCat = selectedCat === "all" || item.category === selectedCat;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Hostel Community Hub
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Zero Brokerage • Student to Student</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Student Marketplace
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Buy and sell secondhand textbooks, lab instruments, cycles, and room essentials directly within your hostel.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Post an Item</span>
        </button>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-light-border dark:border-dark-border/60 overflow-x-auto">
          {CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCat(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCat === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
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
            placeholder="Search items, books, cycles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ── Listings Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 space-y-3.5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-500 dark:text-emerald-400">
                  {item.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  {item.condition}
                </span>
              </div>

              <h3 className="font-bold text-base text-light-text dark:text-dark-text leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="p-3 rounded-xl bg-light-elevated/40 dark:bg-dark-elevated/40 border border-light-border dark:border-dark-border/40 text-xs space-y-1">
                <p className="font-bold text-light-text dark:text-dark-text">Seller: {item.seller}</p>
                <p className="text-light-muted dark:text-dark-muted">{item.room} • {item.date}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-light-border dark:border-dark-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-light-muted dark:text-dark-muted uppercase font-bold block">Asking Price</span>
                <span className="text-xl font-black font-display text-emerald-400">
                  ₹{item.price.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => toast.success(`Chat opened with seller: ${item.seller}`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all"
              >
                <MessageCircle size={14} />
                <span>Contact Seller</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Modal: Post Listing ───────────────────────────────────────────── */}
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
                <h2 className="text-base font-bold text-white font-display">Sell an Item to Hostel Students</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-3.5">
                <div>
                  <label className="font-bold block mb-1">Item Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Scientific Calculator or Drafter"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="books">Textbooks & Notes</option>
                    <option value="lab_gear">Lab Kits & Drafters</option>
                    <option value="appliances">Room Appliances</option>
                    <option value="cycles">Cycles & Mobility</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Mention features, usage duration, and pickup availability in your room..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all"
                >
                  Publish Item Listing
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketplacePage;
