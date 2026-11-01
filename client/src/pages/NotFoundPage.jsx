/**
 * @file NotFoundPage.jsx
 * @description Modern 404 Error Page.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertCircle, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[70vh] flex items-center justify-center p-6 text-center"
    >
      <div className="max-w-md card p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto text-primary-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black font-display text-light-text dark:text-dark-text">
          404
        </h1>
        <h2 className="text-lg font-bold text-light-text dark:text-dark-text">
          Page Not Found
        </h2>
        <p className="text-sm text-light-muted dark:text-dark-muted">
          The page or resource you are looking for does not exist or has been relocated.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-xs py-2 px-4">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
