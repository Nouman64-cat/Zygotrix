import React from "react";
import { CubeIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface SequenceComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const SequenceComponent: React.FC<SequenceComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-blue-500`}
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
          <CubeIcon className="h-5 w-5 text-blue-500 mr-2" />
          <span className="font-semibold text-sm">
            {item.data?.name || "Sequence"}
          </span>
        </div>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono">
          {item.data?.sequence || "No sequence data"}
        </div>
      </div>
    </div>
  );
};

export default SequenceComponent;
