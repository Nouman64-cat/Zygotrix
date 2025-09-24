import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface ChartComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-orange-500`}
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
          <ChartBarIcon className="h-5 w-5 text-orange-500 mr-2" />
          <span className="font-semibold text-sm">
            {item.data?.title || "Chart"}
          </span>
        </div>
        <div className="bg-gray-100 h-16 rounded flex items-center justify-center text-xs text-gray-500">
          Chart Placeholder
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
