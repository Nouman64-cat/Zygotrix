import React, { useState } from "react";
import { AcademicCapIcon, TrashIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline";
import PunnettSquare from "../../dashboard/PunnettSquare";
import type { WorkspaceItem } from "../types";

interface PunnettSquareComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: string) => void;
  onPunnettSquareChange: (
    itemId: string,
    updates: {
      parent1Genotype?: string;
      parent2Genotype?: string;
      phenotypeMap?: Record<string, string>;
    }
  ) => void;
}

const PunnettSquareComponent: React.FC<PunnettSquareComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
  onDeleteItem,
  onPunnettSquareChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [parent1Input, setParent1Input] = useState(item.data?.parent1Genotype || "");
  const [parent2Input, setParent2Input] = useState(item.data?.parent2Genotype || "");

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParent1Input(item.data?.parent1Genotype || "");
    setParent2Input(item.data?.parent2Genotype || "");
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPunnettSquareChange(item.id, {
      parent1Genotype: parent1Input,
      parent2Genotype: parent2Input,
    });
    setIsEditing(false);
  };

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <AcademicCapIcon className="h-4 w-4 text-pink-500 mr-2" />
            <span className="font-semibold text-xs">Punnett Square</span>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="text-gray-400 hover:text-pink-500 p-1 transition-colors"
                  title="Edit genotypes"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => onDeleteItem(e, item.id)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                  title="Delete Punnett square"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="text-gray-400 hover:text-green-500 p-1 transition-colors"
                title="Save changes"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 mb-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Parent 1 Genotype:</label>
              <input
                type="text"
                value={parent1Input}
                onChange={(e) => setParent1Input(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
                placeholder="e.g., Bb, AA, RhDRhd"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Parent 2 Genotype:</label>
              <input
                type="text"
                value={parent2Input}
                onChange={(e) => setParent2Input(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
                placeholder="e.g., Bb, aa, Rhdrhd"
              />
            </div>
          </div>
        ) : null}

        {item.data?.parent1Genotype && item.data?.parent2Genotype ? (
          <PunnettSquare
            parent1Genotype={item.data.parent1Genotype}
            parent2Genotype={item.data.parent2Genotype}
            phenotypeMap={item.data?.phenotypeMap || {}}
            className="scale-75 origin-top-left"
          />
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">
            Click the edit button to set parent genotypes
          </div>
        )}
      </div>
    </div>
  );
};

export default PunnettSquareComponent;
