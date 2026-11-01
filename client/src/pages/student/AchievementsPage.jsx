/**
 * @file AchievementsPage.jsx
 * @description Student Rewards, Badges & Hostel Hall of Fame
 * with point redemption, leaderboard ranking, and gamified resident achievements.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Award, Trophy, Star, Sparkles, CheckCircle2, ShieldCheck,
  Zap, Heart, Coffee, Gift, ArrowRight, TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";

const BADGES = [
  { id: "1", title: "Eco-Warrior Resident", desc: "Energy & AC conservation award for Room A101", icon: Zap, color: "from-emerald-500 to-teal-500", date: "Sep 2026", points: 100 },
  { id: "2", title: "Zero Late Entries", desc: "100% on-time curfew check-in across 90 days", icon: ShieldCheck, color: "from-blue-500 to-indigo-600", date: "Aug 2026", points: 150 },
  { id: "3", title: "Cleanliness Star", desc: "Highest hygiene score during surprise warden inspection", icon: Sparkles, color: "from-purple-500 to-pink-500", date: "Jul 2026", points: 120 },
  { id: "4", title: "Hackathon Rep", desc: "Represented Emerald Hostel at IIT Madras Tech Fest", icon: Trophy, color: "from-amber-500 to-orange-500", date: "May 2026", points: 200 },
];

const LEADERBOARD = [
  { rank: 1, name: "Karthik Raja", dept: "ECE", room: "A102", points: 580, avatar: "https://ui-avatars.com/api/?name=Karthik+R&background=2563eb&color=fff" },
  { rank: 2, name: "Arjun Kumar (You)", dept: "CSE", room: "A101", points: 420, avatar: "https://ui-avatars.com/api/?name=Arjun+K&background=059669&color=fff" },
  { rank: 3, name: "Praveen Kumar", dept: "IT", room: "A104", points: 390, avatar: "https://ui-avatars.com/api/?name=Praveen+K&background=7c3aed&color=fff" },
  { rank: 4, name: "Suresh Balaji", dept: "MECH", room: "A108", points: 340, avatar: "https://ui-avatars.com/api/?name=Suresh+B&background=d97706&color=fff" },
];

const REWARDS = [
  { id: "r1", title: "BIT Canteen ₹150 Voucher", cost: 150, icon: Coffee, desc: "Valid at campus cafeteria and juice corner" },
  { id: "r2", title: "5 Bonus Laundromat Tokens", cost: 100, icon: Sparkles, desc: "Added directly to your monthly wash quota" },
  { id: "r3", title: "Late Study Room Key Access", cost: 250, icon: Award, desc: "24/7 access to AC reading suite during exam week" },
];

const AchievementsPage = () => {
  const [points, setPoints] = useState(420);

  const handleRedeem = (reward) => {
    if (points < reward.cost) {
      toast.error("Insufficient reward points to redeem this voucher.");
      return;
    }
    setPoints(points - reward.cost);
    toast.success(`Redeemed "${reward.title}"! Voucher code sent via SMS.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
              Hostel Hall of Fame
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Rank #2 in Block A</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Achievements & Rewards
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            Earn hostel merit points through energy conservation, hygiene, and representational awards.
          </p>
        </div>

        {/* Total Points Badge */}
        <div className="card p-3.5 px-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-400 block tracking-wider">Reward Balance</span>
            <span className="text-2xl font-black font-display text-light-text dark:text-dark-text">{points} Pts</span>
          </div>
        </div>
      </div>

      {/* ── Badges Showcase ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
          <Award size={18} className="text-amber-500" />
          Badges & Honors Earned
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.id}
                whileHover={{ y: -3 }}
                className="card p-5 space-y-3 border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-light-text dark:text-dark-text">{b.title}</h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">{b.desc}</p>
                </div>
                <div className="pt-2 border-t border-light-border dark:border-dark-border/40 flex justify-between items-center text-[11px] text-light-muted dark:text-dark-muted">
                  <span>{b.date}</span>
                  <span className="font-bold text-amber-400">+{b.points} pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Leaderboard & Point Redemption ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard (Span 2) */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border/60 pb-3">
            <h3 className="font-bold font-display text-base text-light-text dark:text-dark-text flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              Emerald Block A Merit Leaderboard
            </h3>
            <span className="text-xs font-bold text-emerald-400">Updated Daily</span>
          </div>

          <div className="space-y-2.5">
            {LEADERBOARD.map((item) => (
              <div
                key={item.rank}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  item.name.includes("You")
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-light-elevated/40 dark:bg-dark-elevated/40 border-light-border dark:border-dark-border/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    item.rank === 1 ? "bg-amber-400 text-slate-950 font-black shadow-md" :
                    item.rank === 2 ? "bg-slate-300 text-slate-900 font-black" :
                    "bg-slate-700 text-slate-300"
                  }`}>
                    {item.rank}
                  </span>
                  <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">{item.name}</p>
                    <p className="text-xs text-light-muted dark:text-dark-muted">{item.dept} • Room {item.room}</p>
                  </div>
                </div>

                <span className="font-black font-display text-sm text-amber-500 dark:text-amber-400">
                  {item.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Catalog */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold font-display text-base text-light-text dark:text-dark-text flex items-center gap-2 border-b border-light-border dark:border-dark-border/60 pb-3">
            <Gift size={18} className="text-purple-400" />
            Redeem Points
          </h3>

          <div className="space-y-3">
            {REWARDS.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl border border-light-border dark:border-dark-border/50 bg-light-elevated/40 dark:bg-dark-elevated/40 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-light-text dark:text-dark-text truncate">{r.title}</p>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted line-clamp-1">{r.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black font-display text-amber-400">{r.cost} Pts</span>
                    <button
                      onClick={() => handleRedeem(r)}
                      className="px-3 py-1 rounded-xl text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-all"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
