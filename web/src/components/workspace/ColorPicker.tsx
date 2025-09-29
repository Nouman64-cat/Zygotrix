import React, { useState } from "react";
import { SwatchIcon } from "@heroicons/react/24/outline";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  // Reds / Warm
  "bg-red-400",
  "bg-red-500",
  "bg-red-600",
  "bg-rose-400",
  "bg-rose-500",
  // Oranges / Yellows
  "bg-orange-400",
  "bg-orange-500",
  "bg-amber-400",
  "bg-amber-500",
  "bg-yellow-400",
  "bg-yellow-500",
  // Greens
  "bg-lime-400",
  "bg-lime-500",
  "bg-green-400",
  "bg-green-500",
  "bg-emerald-400",
  "bg-emerald-500",
  // Teals / Cyans
  "bg-teal-400",
  "bg-teal-500",
  "bg-cyan-400",
  "bg-cyan-500",
  // Blues
  "bg-sky-400",
  "bg-sky-500",
  "bg-blue-400",
  "bg-blue-500",
  "bg-indigo-400",
  "bg-indigo-500",
  // Purples
  "bg-violet-400",
  "bg-violet-500",
  "bg-purple-400",
  "bg-purple-500",
  "bg-fuchsia-400",
  "bg-fuchsia-500",
  // Pinks
  "bg-pink-400",
  "bg-pink-500",
  // Neutrals
  "bg-slate-400",
  "bg-slate-500",
  "bg-gray-400",
  "bg-gray-500",
  "bg-neutral-400",
  "bg-neutral-500",
  "bg-zinc-400",
  "bg-zinc-500",
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Color Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-8 h-8 ${currentColor} rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform`}
        title="Change project color"
      >
        <SwatchIcon className="h-4 w-4 text-white" />
      </button>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop (accessible) */}
          <button
            className="fixed inset-0 z-10 bg-transparent border-0 p-0"
            onClick={() => setIsOpen(false)}
            aria-label="Close color picker"
          />

          {/* Color Grid */}
          <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 ${color} rounded-full border-2 hover:scale-110 transition-transform ${
                    currentColor === color
                      ? "border-gray-800 ring-2 ring-gray-300"
                      : "border-gray-300"
                  }`}
                  title={color.replace("bg-", "").replace("-500", "")}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;
