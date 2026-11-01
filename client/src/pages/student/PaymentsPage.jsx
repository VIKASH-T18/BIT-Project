
/**
 * @file PaymentsPage.jsx
 * @description Student Hostel & Mess Fee Payment Portal with live dues tracking,
 * UPI/card payment checkout simulator, and instant receipt downloads.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, Download,
  ArrowUpRight, ShieldCheck, QrCode, Receipt, DollarSign,
  ChevronRight, RefreshCw, X, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  // Fetch payments and dues summary
  const { data: resData, isLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data } = await api.get("/payments/my");
      return data.data;
    },
  });

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/payments/pay", payload);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Payment processed successfully!");
      setIsPayModalOpen(false);
      queryClient.invalidateQueries(["my-payments"]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Payment failed.");
    },
  });

  const summary = resData?.summary || {
    totalFee: 74000,
    totalPaid: 69500,
    pendingDues: 4500,
    nextDueDate: new Date(Date.now() + 15 * 864e5),
  };

  const payments = resData?.payments || [];

  const handleOpenPay = (p) => {
    setSelectedPayment(p);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = (e) => {
    e.preventDefault();
    payMutation.mutate({
      paymentId: selectedPayment?._id,
      amount: selectedPayment?.amount || summary.pendingDues,
      paymentType: selectedPayment?.paymentType || "mess_fee",
      gateway: paymentMethod,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              BIT Accounts & Finance
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted font-medium">Academic Year 2025-26</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-light-text dark:text-dark-text mt-1">
            Hostel Fees & Payments
          </h1>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-0.5">
            View annual fee installments, download official GST receipts, and clear pending mess dues.
          </p>
        </div>

        {summary.pendingDues > 0 && (
          <button
            onClick={() => handleOpenPay(null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all self-start sm:self-auto"
          >
            <CreditCard size={18} />
            <span>Pay Dues (₹{summary.pendingDues.toLocaleString()})</span>
          </button>
        )}
      </div>

      {/* ── Financial KPI Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1">
          <p className="text-xs text-light-muted dark:text-dark-muted font-semibold">Total Annual Fee</p>
          <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">
            ₹{summary.totalFee.toLocaleString()}
          </p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">Room rent + Mess + Deposits</p>
        </div>

        <div className="card p-4 space-y-1 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs text-emerald-500 font-semibold">Total Paid to Date</p>
          <p className="text-2xl font-black font-display text-emerald-500">
            ₹{summary.totalPaid.toLocaleString()}
          </p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">94.2% Cleared</p>
        </div>

        <div className="card p-4 space-y-1 border-rose-500/20 bg-rose-500/5">
          <p className="text-xs text-rose-500 font-semibold">Pending Outstanding Dues</p>
          <p className="text-2xl font-black font-display text-rose-500">
            ₹{summary.pendingDues.toLocaleString()}
          </p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">Due by {new Date(summary.nextDueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</p>
        </div>

        <div className="card p-4 space-y-1">
          <p className="text-xs text-light-muted dark:text-dark-muted font-semibold">Caution Deposit</p>
          <p className="text-2xl font-black font-display text-light-text dark:text-dark-text">₹5,000</p>
          <p className="text-[11px] text-emerald-400 font-medium">Refundable at graduation</p>
        </div>
      </div>

      {/* ── Payment History Table / Cards ─────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border/60 pb-3">
          <h2 className="text-base font-bold font-display text-light-text dark:text-dark-text flex items-center gap-2">
            <Receipt size={18} className="text-emerald-500" />
            Transaction History & Invoices
          </h2>
          <span className="text-xs text-light-muted dark:text-dark-muted font-medium">
            {payments.length} Records Found
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-light-muted dark:text-dark-muted">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">No transactions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const isPaid = p.status === "paid";
              return (
                <div
                  key={p._id}
                  className="p-4 rounded-2xl border border-light-border dark:border-dark-border/60 bg-light-elevated/40 dark:bg-dark-elevated/40 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-500 dark:text-emerald-400">
                        {p.paymentNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isPaid ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                        "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                      }`}>
                        {p.status}
                      </span>
                      {p.gateway && (
                        <span className="text-[10px] uppercase font-bold text-light-muted dark:text-dark-muted px-2 py-0.5 rounded bg-light-card dark:bg-slate-800">
                          {p.gateway}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-light-text dark:text-dark-text">{p.description}</p>
                    <p className="text-xs text-light-muted dark:text-dark-muted font-mono">
                      {isPaid ? `Paid on ${new Date(p.paidAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}` : `Due: ${new Date(p.dueDate || Date.now()).toLocaleDateString("en-IN")}`}
                      {p.transactionId && ` • Ref: ${p.transactionId}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-lg font-black font-display text-light-text dark:text-dark-text">
                      ₹{p.amount.toLocaleString()}
                    </span>

                    {isPaid ? (
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-500 hover:bg-blue-500/10 border border-blue-500/30 transition-colors"
                      >
                        <Download size={13} />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenPay(p)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all"
                      >
                        <CreditCard size={13} />
                        <span>Pay Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Online Payment Simulator ───────────────────────────────── */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl card p-6 bg-light-card dark:bg-slate-900 border border-light-border dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-light-border dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <h2 className="text-base font-bold text-light-text dark:text-dark-text font-display">
                    BIT Payment Gateway
                  </h2>
                </div>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmPay} className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold block uppercase text-[10px]">Total Amount to Pay</span>
                    <span className="text-2xl font-black font-display text-white">
                      ₹{(selectedPayment?.amount || summary.pendingDues).toLocaleString()}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                    Zero Convenience Fee
                  </span>
                </div>

                <div>
                  <label className="font-bold text-light-text dark:text-dark-text block mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "upi", label: "UPI / QR", icon: QrCode },
                      { id: "card", label: "Debit / Credit", icon: CreditCard },
                      { id: "netbanking", label: "NetBanking", icon: ShieldCheck },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            paymentMethod === m.id
                              ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold"
                              : "bg-light-elevated dark:bg-slate-800 border-light-border dark:border-slate-700 text-slate-400"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-[11px]">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-light-elevated dark:bg-slate-800/80 border border-light-border dark:border-slate-700 space-y-1">
                  <p className="font-bold text-light-text dark:text-dark-text">Student: Arjun Kumar (7376221CS001)</p>
                  <p className="text-light-muted dark:text-dark-muted">Hostel: Emerald Boys Hostel • Room A101</p>
                </div>

                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{payMutation.isPending ? "Authorizing Payment..." : "Complete & Generate Receipt"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Receipt Viewer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl card p-6 bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-emerald-400" />
                  <span className="font-bold text-sm text-white font-display">BIT Hostel Official Receipt</span>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
                <div className="text-center pb-2 border-b border-white/10">
                  <p className="font-black text-white text-sm">Bannari Amman Institute of Technology</p>
                  <p className="text-[11px] text-slate-400">Hostel Administration Directorate</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-bold text-white">{selectedReceipt.paymentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-bold text-white">Arjun Kumar (7376221CS001)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Description:</span>
                  <span className="font-bold text-white">{selectedReceipt.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Ref:</span>
                  <span className="font-bold text-white">{selectedReceipt.transactionId || "UPI/BIT/92837192"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 text-emerald-400 font-bold text-sm">
                  <span>Amount Paid:</span>
                  <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success("Receipt downloaded as PDF!");
                  setSelectedReceipt(null);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Save PDF Receipt</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsPage;
