import React from "react";

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  type?: string;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  maxLength,
  type = "text",
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      placeholder={placeholder}
    />
  </div>
);

export default LabeledInput;
