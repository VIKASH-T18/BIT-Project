/**
 * @file DocumentVerificationPage.jsx
 * @description Admin & Warden Document Verification — view submitted student documents,
 * preview credentials, approve or reject with custom feedback.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, XCircle, Clock, Search, Filter,
  ExternalLink, AlertCircle, Eye, ShieldCheck, RefreshCw, X
} from "lucide-react";
import api from "../../services/api";

const DOC_TYPE_LABELS = {
  college_id: "College ID Card",
  aadhaar: "Aadhaar / Gov ID",
  medical_certificate: "Medical Certificate",
  income_certificate: "Income Certificate",
  tc: "Transfer Certificate",
  photo: "Passport Photo",
  other: "Other Document",
};

const DocumentVerificationPage = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewModalDoc, setReviewModalDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");

  // Fetch documents
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-documents", selectedStatus],
    queryFn: async () => {
      const params = selectedStatus === "all" ? {} : { status: selectedStatus };
      const res = await api.get("/documents", { params });
      return res.data?.data || { documents: [], total: 0, stats: [] };
    },
    staleTime: 10000,
  });

  const documents = data?.documents || [];

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) => {
      const res = await api.patch(`/documents/${id}/verify`, { status, rejectionReason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-documents"]);
      setReviewModalDoc(null);
      setRejectionReason("");
      setActionError("");
    },
    onError: (err) => {
      setActionError(err.response?.data?.message || "Failed to update document status");
    },
  });

  // Calculate statistics
  const pendingCount = data?.pendingCount ?? documents.filter((d) => d.status === "pending").length;
  const approvedCount = data?.approvedCount ?? documents.filter((d) => d.status === "approved").length;
  const rejectedCount = data?.rejectedCount ?? documents.filter((d) => d.status === "rejected").length;
  const totalCount = data?.total ?? documents.length;

  // Filter by search query
  const filteredDocs = documents.filter((doc) => {
    const studentName = doc.student?.user?.name || "";
    const regNo = doc.student?.registerNumber || "";
    const docType = DOC_TYPE_LABELS[doc.docType] || doc.docType || "";
    const q = searchQuery.toLowerCase();
    return (
      studentName.toLowerCase().includes(q) ||
      regNo.toLowerCase().includes(q) ||
      docType.toLowerCase().includes(q)
    );
  });

  const handleVerify = (status) => {
    if (status === "rejected" && !rejectionReason.trim()) {
      setActionError("Please provide a reason for rejection.");
      return;
    }
    if (!reviewModalDoc) return;
    verifyMutation.mutate({
      id: reviewModalDoc._id,
      status,
      rejectionReason: status === "rejected" ? rejectionReason : undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-light-text dark:text-dark-text flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <ShieldCheck className="w-8 h-8" />
            </span>
            Document Verification
          </h1>
          <p className="text-light-muted dark:text-dark-muted mt-1">
            Review, verify, and authenticate student onboarding credentials and certificates.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary self-start md:self-auto flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Records
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                Total Files
              </p>
              <h3 className="text-2xl font-black text-light-text dark:text-dark-text mt-1">
                {totalCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                Pending Review
              </p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">
                {pendingCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                Approved
              </p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">
                {approvedCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                Rejected
              </p>
              <h3 className="text-2xl font-black text-rose-500 mt-1">
                {rejectedCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-light-card/60 dark:bg-dark-card/60 rounded-xl border border-light-border dark:border-dark-border w-full md:w-auto">
          {[
            { id: "all", label: "All Documents" },
            { id: "pending", label: "Pending" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === tab.id
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, reg no, doc type..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      {/* Document List / Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-2" />
            <p className="text-light-muted dark:text-dark-muted text-sm">Loading documents...</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-80" />
            <p className="font-semibold">Unable to fetch verification records</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 text-primary-500">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1">
              No Documents Found
            </h3>
            <p className="text-light-muted dark:text-dark-muted text-sm max-w-sm mx-auto">
              {searchQuery
                ? `No documents matched "${searchQuery}". Try adjusting your search.`
                : "No student uploaded documents matching this filter status yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted text-xs font-semibold uppercase tracking-wider border-b border-light-border dark:border-dark-border">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Document Type</th>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Uploaded Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filteredDocs.map((doc) => {
                  const student = doc.student || {};
                  const user = student.user || {};
                  return (
                    <tr
                      key={doc._id}
                      className="hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-600 font-bold text-xs uppercase">
                            {user.name ? user.name.slice(0, 2) : "ST"}
                          </div>
                          <div>
                            <p className="font-semibold text-light-text dark:text-dark-text">
                              {user.name || "Student"}
                            </p>
                            <p className="text-xs text-light-muted dark:text-dark-muted">
                              {student.registerNumber || user.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-light-text dark:text-dark-text">
                          {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-light-muted dark:text-dark-muted max-w-xs truncate">
                        {doc.fileName || "document_upload.pdf"}
                      </td>
                      <td className="px-6 py-4 text-xs text-light-muted dark:text-dark-muted">
                        {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            doc.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : doc.status === "rejected"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}
                        >
                          {doc.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {doc.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                          {doc.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface text-light-muted hover:text-primary-500"
                              title="Open Original File"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setReviewModalDoc(doc);
                              setRejectionReason(doc.rejectionReason || "");
                              setActionError("");
                            }}
                            className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Verification Modal */}
      <AnimatePresence>
        {reviewModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl w-full max-w-xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setReviewModalDoc(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-light-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-light-text dark:text-dark-text">
                    Review Document
                  </h3>
                  <p className="text-xs text-light-muted dark:text-dark-muted">
                    {DOC_TYPE_LABELS[reviewModalDoc.docType] || reviewModalDoc.docType}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-4 text-sm bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-border dark:border-dark-border mb-4">
                <div className="flex justify-between">
                  <span className="text-light-muted dark:text-dark-muted">Student:</span>
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {reviewModalDoc.student?.user?.name || "Student"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-muted dark:text-dark-muted">Register Number:</span>
                  <span className="font-semibold text-light-text dark:text-dark-text">
                    {reviewModalDoc.student?.registerNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-muted dark:text-dark-muted">Current Status:</span>
                  <span className="font-semibold capitalize text-light-text dark:text-dark-text">
                    {reviewModalDoc.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-light-muted dark:text-dark-muted">Attached File:</span>
                  <a
                    href={reviewModalDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline flex items-center gap-1 font-medium text-xs"
                  >
                    View File <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Rejection Reason textarea (if rejecting or rejected) */}
              <div className="space-y-1.5 mb-6">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                  Remarks / Rejection Reason (Required if rejecting)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Image blurry, register number not clearly legible..."
                  className="w-full p-3 text-xs rounded-xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalDoc(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() => handleVerify("rejected")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Document
                </button>
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() => handleVerify("approved")}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DocumentVerificationPage;
