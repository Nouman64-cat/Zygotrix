import React from "react";

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
  <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
    <div className="text-red-600 text-sm">{message}</div>
  </div>
);

export default ErrorAlert;
