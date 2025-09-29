import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import PunnettSquare from "../../dashboard/PunnettSquare";
import type { WorkspaceItem } from "../types";

interface PunnettSquareComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const PunnettSquareComponent: React.FC<PunnettSquareComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-pink-500`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      <div className="p-2 h-full overflow-auto">
        <div className="flex items-center mb-2">
          <AcademicCapIcon className="h-4 w-4 text-pink-500 mr-2" />
          <span className="font-semibold text-xs">Punnett Square</span>
        </div>
        <PunnettSquare
          parent1Genotype={item.data?.parent1Genotype || ""}
          parent2Genotype={item.data?.parent2Genotype || ""}
          phenotypeMap={item.data?.phenotypeMap || {}}
          className="scale-75 origin-top-left"
        />
      </div>
    </div>
  );
};

export default PunnettSquareComponent;
