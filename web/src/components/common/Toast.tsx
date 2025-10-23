import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gradient-to-r from-green-50 to-emerald-50",
          border: "border-green-200",
          text: "text-green-800",
          icon: <FiCheckCircle className="h-5 w-5 text-green-600" />,
        };
      case "error":
        return {
          bg: "bg-gradient-to-r from-red-50 to-rose-50",
          border: "border-red-200",
          text: "text-red-800",
          icon: <FiAlertCircle className="h-5 w-5 text-red-600" />,
        };
      case "warning":
        return {
          bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
          border: "border-amber-200",
          text: "text-amber-800",
          icon: <FiAlertCircle className="h-5 w-5 text-amber-600" />,
        };
      case "info":
      default:
        return {
          bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: <FiInfo className="h-5 w-5 text-blue-600" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] max-w-md transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`${styles.bg} ${styles.border} ${styles.text} rounded-2xl border-2 shadow-lg backdrop-blur-sm p-4 flex items-start gap-3`}
      >
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="Close notification"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
