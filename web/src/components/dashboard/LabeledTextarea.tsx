import React from "react";

interface LabeledTextareaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const LabeledTextarea: React.FC<LabeledTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
  className = "",
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      placeholder={placeholder}
    />
  </div>
);

export default LabeledTextarea;
