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
    className="flex items-center gap-2 px-4 py-2 mt-2 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md cursor-pointer dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 dark:shadow-blue-900/30"
    type="button"
  >
    <p className="flex items-center gap-2 text-sm">
      <MdHelpOutline className="w-4 h-4" />
      How these results?
    </p>
  </button>
);

export default HowTheseResultsButton;
