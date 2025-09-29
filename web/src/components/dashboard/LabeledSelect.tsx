import React from "react";

interface Option {
  value: string;
  label: string;
}

interface LabeledSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  className?: string;
}

const LabeledSelect: React.FC<LabeledSelectProps> = ({
  label,
  value,
  onChange,
  options,
  className = "",
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    >
      <option value="">Choose an option...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default LabeledSelect;
