import React from "react";
import { MdHelpOutline } from "react-icons/md";

interface HowTheseResultsButtonProps {
  onClick: () => void;
}

const HowTheseResultsButton: React.FC<HowTheseResultsButtonProps> = ({
  onClick,
}) => (
  <button
    onClick={onClick}
    className="bg-blue-600 cursor-pointer hover:bg-blue-800 text-white py-2 px-4 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-md mt-2 flex items-center gap-2"
    type="button"
  >
    <p className="flex items-center gap-2 text-sm">
      <MdHelpOutline className="w-4 h-4" />
      How these results?
    </p>
  </button>
);

export default HowTheseResultsButton;
