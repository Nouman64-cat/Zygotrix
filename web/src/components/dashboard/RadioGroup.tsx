import React from "react";

interface RadioOption {
  value: string | boolean;
  label: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  className = "",
}) => (
  <div className={`space-y-2 ${className}`}>
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <div className="flex items-center space-x-4">
      {options.map((opt) => (
        <label key={String(opt.value)} className="flex items-center">
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mr-2"
          />
          <span className="text-sm text-slate-600">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export default RadioGroup;
