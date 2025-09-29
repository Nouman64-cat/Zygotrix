import React from "react";

interface ParentGenotypeSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ParentGenotypeSelect: React.FC<ParentGenotypeSelectProps> = ({
  label,
  value,
  options,
  onChange,
}) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="px-2 py-1 border border-gray-300 rounded"
    >
      <option value="">Select genotype</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default ParentGenotypeSelect;
