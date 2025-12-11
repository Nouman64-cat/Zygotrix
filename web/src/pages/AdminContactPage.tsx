import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../components/universal/ConfirmationModal";
import * as contactApi from "../services/contact.api";
import type { ContactSubmission } from "../services/contact.api";
import {
  MdEmail,
  MdPerson,
  MdPhone,
  MdMessage,
  MdDelete,
  MdCheckCircle,
  MdError,
  MdClose,
  MdMarkEmailRead,
  MdMarkunread,
} from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { FiInbox } from "react-icons/fi";

const AdminContactPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    submissionId: string;
  }>({ isOpen: false, submissionId: "" });

  const isSuperAdmin = currentUser?.user_role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSubmissions();
    }
  }, [isSuperAdmin]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactApi.getAllContactSubmissions();
      setSubmissions(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch submissions";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (submissionId: string) => {
    setConfirmModal({ isOpen: true, submissionId });
  };

  const handleConfirmDelete = async () => {
    const submissionId = confirmModal.submissionId;

    try {
      setDeletingId(submissionId);
      setError(null);

      await contactApi.deleteContactSubmission(submissionId);

      setSubmissions((prev) =>
        prev.filter((sub) => sub.id !== submissionId)
      );

      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }

      setSuccessMessage("Submission deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete submission";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAsRead = async (submissionId: string) => {
    try {
      await contactApi.markSubmissionAsRead(submissionId);
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? { ...sub, is_read: true } : sub
        )
      );
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, is_read: true });
      }
    } catch (err: unknown) {
      console.error("Failed to mark as read:", err);
    }
  };

  const unreadCount = submissions.filter((sub) => !sub.is_read).length;

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <MdError className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-slate-400">
              You need super admin privileges to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500">
              <FiInbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Contact Submissions
              </h1>
              <p className="text-sm text-slate-400">
                Manage messages from contact form
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                <span className="text-sm font-medium">
                  {unreadCount} unread
                </span>
              </div>
            )}
            <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <span className="text-sm font-medium text-white">
                {submissions.length}
              </span>
              <span className="text-sm text-slate-400 ml-2">total</span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdCheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-400 text-sm">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdError className="w-5 h-5 text-red-500" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-400"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left: List of Submissions */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-800">
                <h2 className="text-sm font-semibold text-white">
                  All Messages
                </h2>
              </div>

              <div className="max-h-[700px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <BiLoaderAlt className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <FiInbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      No submissions yet
                    </p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubmission(sub);
                        if (!sub.is_read) {
                          handleMarkAsRead(sub.id);
                        }
                      }}
                      className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${
                        selectedSubmission?.id === sub.id
                          ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                          : "hover:bg-slate-700/50"
                      } ${!sub.is_read ? "bg-blue-500/5" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {!sub.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                          <h3 className="text-sm font-semibold text-white truncate">
                            {sub.name || "Anonymous"}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(sub.id);
                          }}
                          disabled={deletingId === sub.id}
                          className="text-slate-500 hover:text-red-500 transition-colors"
                        >
                          {deletingId === sub.id ? (
                            <BiLoaderAlt className="w-4 h-4 animate-spin" />
                          ) : (
                            <MdDelete className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{sub.email}</p>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {sub.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected Submission Detail */}
          <div className="lg:col-span-7">
            {selectedSubmission ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {selectedSubmission.is_read ? (
                      <MdMarkEmailRead className="w-5 h-5 text-slate-500" />
                    ) : (
                      <MdMarkunread className="w-5 h-5 text-blue-500" />
                    )}
                    <h2 className="text-lg font-semibold text-white">
                      Message Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  {selectedSubmission.name && (
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <MdPerson className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="text-sm text-white">
                          {selectedSubmission.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                    <MdEmail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {selectedSubmission.email}
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  {selectedSubmission.phone && (
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <MdPhone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <a
                          href={`tel:${selectedSubmission.phone}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {selectedSubmission.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <MdMessage className="w-5 h-5 text-slate-400" />
                      <p className="text-xs text-slate-500">Message</p>
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {selectedSubmission.message}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-700">
                    Submitted on{" "}
                    {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center h-full">
                <FiInbox className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Message Selected
                </h3>
                <p className="text-sm text-slate-400">
                  Select a message from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, submissionId: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete Contact Submission"
        message="Are you sure you want to delete this contact submission? This action cannot be undone and all information will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deletingId === confirmModal.submissionId}
      />
    </DashboardLayout>
  );
};

export default AdminContactPage;
