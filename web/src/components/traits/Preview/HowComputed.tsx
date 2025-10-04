import React from "react";

type HowComputedProps = {
  steps: string[];
};

const HowComputed: React.FC<HowComputedProps> = ({ steps }) => {
  if (!steps.length) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        How this is computed
      </h3>
      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`} className="leading-tight">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default HowComputed;

