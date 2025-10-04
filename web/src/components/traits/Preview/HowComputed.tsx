import React from "react";

type HowComputedProps = {
  steps: string[];
};

const HowComputed: React.FC<HowComputedProps> = ({ steps }) => {
  if (!steps.length) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Computation steps will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            How this is computed
          </h3>
          <p className="text-sm text-gray-600">
            Step-by-step calculation breakdown
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={`${index}-${step}`}
            className="flex items-start gap-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-100 hover:from-blue-50 hover:to-blue-100/50 hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex-shrink-0 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {index + 1}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-medium text-blue-700">
            These calculations assume Mendelian inheritance patterns and
            independent assortment
          </span>
        </div>
      </div>
    </div>
  );
};

export default HowComputed;
