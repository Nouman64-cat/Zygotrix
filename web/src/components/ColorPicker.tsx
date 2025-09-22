import React, { useState } from "react";
import { SwatchIcon } from "@heroicons/react/24/outline";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-slate-500",
  "bg-gray-500",
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
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
