import React from "react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface VariantComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const VariantComponent: React.FC<VariantComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-green-500`}
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
          <BeakerIcon className="h-5 w-5 text-green-500 mr-2" />
          <span className="font-semibold text-sm">Variant</span>
        </div>
        <div className="space-y-1 text-xs">
          <div>
            <span className="font-medium">Position:</span>{" "}
            {item.data?.position || "Unknown"}
          </div>
          <div>
            <span className="font-medium">Change:</span> {item.data?.ref || "?"}{" "}
            → {item.data?.alt || "?"}
          </div>
          <div>
            <span className="font-medium">Gene:</span>{" "}
            {item.data?.gene || "Unknown"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantComponent;
