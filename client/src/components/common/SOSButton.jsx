/**
 * @file SOSButton.jsx
 * @description Emergency SOS floating action button.
 * Sends real-time alert to wardens via Socket.IO.
 */

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, MapPin, Send } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/slices/authSlice";
import { getSocket } from "../../services/socket";
import toast from "react-hot-toast";

const SOSButton = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const user = useSelector(selectCurrentUser);

  if (user?.role !== "student") return null;
  if (location.pathname.startsWith("/chat")) return null;

  const handleSOS = () => {
    setSending(true);
    const socket = getSocket();

    if (!socket?.connected) {
      toast.error("Not connected to server. Please refresh.");
      setSending(false);
      return;
    }

    socket.emit("sos_alert", {
      message: message || "EMERGENCY! I need immediate help!",
    });

    socket.once("sos_sent", () => {
      toast.success("🚨 SOS sent! Help is on the way.", { duration: 5000 });
      setOpen(false);
      setMessage("");
      setSending(false);
    });

    setTimeout(() => { setSending(false); }, 3000);
  };

  return (
    <>
      {/* SOS Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fab sos-btn"
        aria-label="Emergency SOS"
        title="Emergency SOS"
      >
        <AlertCircle size={24} />
      </motion.button>

      {/* SOS Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="fixed bottom-24 right-6 w-80 z-modal card border-2 border-red-500/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <h3 className="font-bold text-red-500">Emergency SOS</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-light-elevated dark:hover:bg-dark-elevated">
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-light-muted dark:text-dark-muted mb-3">
                This will immediately alert all wardens and admins. Use only in genuine emergencies.
              </p>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the emergency (optional)..."
                className="input resize-none h-20 mb-3"
              />

              <button
                onClick={handleSOS}
                disabled={sending}
                className="btn btn-danger w-full"
              >
                {sending ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <Send size={16} />
                    Send Emergency Alert
                  </>
                )}
              </button>

              <p className="text-xs text-center text-light-muted dark:text-dark-muted mt-2">
                Emergency: +91 98765 43210
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SOSButton;
