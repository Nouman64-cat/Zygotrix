import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface AnalysisComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const AnalysisComponent: React.FC<AnalysisComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-purple-500`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      <div className="p-4">
        <div className="flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 text-purple-500 mr-2" />
          <span className="font-semibold text-sm">
            {item.data?.name || "Analysis"}
          </span>
        </div>
        <div className="bg-purple-50 p-2 rounded text-xs">
          Status: {item.data?.status || "Unknown"}
        </div>
      </div>
    </div>
  );
};

export default AnalysisComponent;
