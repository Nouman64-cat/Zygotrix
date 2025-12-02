import React from "react";
import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-900/20",
          iconColor: "text-red-400",
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          titleColor: "text-red-400",
        };
      case "warning":
        return {
          iconBg: "bg-yellow-900/20",
          iconColor: "text-yellow-400",
          confirmBtn: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          titleColor: "text-yellow-400",
        };
      case "info":
        return {
          iconBg: "bg-blue-900/20",
          iconColor: "text-blue-400",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          titleColor: "text-blue-400",
        };
      default:
        return {
          iconBg: "bg-slate-700",
          iconColor: "text-slate-400",
          confirmBtn: "bg-slate-600 hover:bg-slate-700 focus:ring-slate-500",
          titleColor: "text-white",
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all border border-slate-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-xl flex items-center justify-center`}
            >
              {type === "danger" ? (
                <FiTrash2 className={`h-6 w-6 ${styles.iconColor}`} />
              ) : (
                <FiAlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${styles.titleColor} mb-2`}>
                {title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border-2 border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
