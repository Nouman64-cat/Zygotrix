import React from "react";

interface TraitSelectorProps {
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableCount: number;
  onAddTrait: (traitKey: string) => void;
  filteredTraits: Array<{ key: string; name: string }>;
  selectedTraits: Array<{ key: string }>;
}

const TraitSelector: React.FC<TraitSelectorProps> = ({
  searchTerm,
  onSearch,
  availableCount,
  onAddTrait,
  filteredTraits,
  selectedTraits,
}) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Search Traits
    </label>
    <input
      type="text"
      value={searchTerm}
      onChange={onSearch}
      placeholder="Type to search traits..."
      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
    />
    <div className="text-xs text-gray-500 mb-2">
      {availableCount} traits available
    </div>
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {filteredTraits.map((trait) => (
        <button
          key={trait.key}
          className="w-full text-left px-3 py-2 rounded hover:bg-indigo-100 disabled:opacity-50"
          onClick={() => onAddTrait(trait.key)}
          disabled={selectedTraits.some((t) => t.key === trait.key)}
        >
          {trait.name}
        </button>
      ))}
    </div>
  </div>
);

export default TraitSelector;
