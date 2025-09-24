import React from "react";
import {
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface MendelianStudyComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  editingItemNameId: string | null;
  editingItemName: string;
  setEditingItemName: (name: string) => void;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onNameClick: (e: React.MouseEvent, item: WorkspaceItem) => void;
  onNameSave: (itemId: string, name: string) => void;
  onNameCancel: () => void;
  onEditItem: (e: React.MouseEvent, item: WorkspaceItem) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: string) => void;
}

const MendelianStudyComponent: React.FC<MendelianStudyComponentProps> = ({
  item,
  commonClasses,
  editingItemNameId,
  editingItemName,
  setEditingItemName,
  onMouseDown,
  onNameClick,
  onNameSave,
  onNameCancel,
  onEditItem,
  onDeleteItem,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-indigo-500`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      <div className="p-4 h-full overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <AcademicCapIcon className="h-5 w-5 text-indigo-500 mr-2" />
            {editingItemNameId === item.id ? (
              <input
                type="text"
                value={editingItemName}
                onChange={(e) => setEditingItemName(e.target.value)}
                onBlur={() => onNameSave(item.id, editingItemName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onNameSave(item.id, editingItemName);
                  if (e.key === "Escape") onNameCancel();
                }}
                autoFocus
                className="font-semibold text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 py-0.5 flex-1"
              />
            ) : (
              <span
                className="font-semibold text-sm cursor-text hover:bg-indigo-50 rounded px-1 py-0.5 transition-colors"
                onClick={(e) => onNameClick(e, item)}
              >
                {item.data?.name || "Mendelian Study"}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => onEditItem(e, item)}
              className="p-1 text-gray-400 cursor-pointer hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Edit study"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onDeleteItem(e, item.id)}
              className="p-1 text-gray-400 cursor-pointer hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete study"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        {item.data?.selectedTraits && item.data.selectedTraits.length > 0 && (
          <div className="space-y-2 text-xs">
            <div className="bg-indigo-50 p-2 rounded">
              <div className="font-medium">
                Traits ({item.data.selectedTraits.length}):
              </div>
              {item.data.selectedTraits.map((trait: any, index: number) => (
                <div key={index} className="text-xs text-gray-600 mt-1">
                  {trait.name}: {trait.parent1Genotype} ×{" "}
                  {trait.parent2Genotype}
                </div>
              ))}
            </div>
            {item.data.simulationResults && (
              <div className="space-y-1">
                <div className="font-medium">Results:</div>
                {Object.entries(item.data.simulationResults).map(
                  ([traitKey, results]: [string, any]) => (
                    <div key={traitKey} className="bg-slate-50 p-2 rounded">
                      <div className="font-medium text-xs mb-1">
                        {item.data.selectedTraits.find(
                          (t: any) => t.key === traitKey
                        )?.name || traitKey}
                      </div>
                      {results &&
                        Object.entries(results).map(
                          ([phenotype, prob]: [string, any]) => (
                            <div
                              key={phenotype}
                              className="flex justify-between text-xs"
                            >
                              <span>{phenotype}</span>
                              <span className="font-mono">
                                {item.data.asPercentages
                                  ? `${prob.toFixed(1)}%`
                                  : `${(prob * 100).toFixed(1)}%`}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  )
                )}
              </div>
            )}
            {item.data.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded border">
                <div className="flex items-center mb-1">
                  <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="font-medium text-xs text-gray-600">
                    Notes
                  </span>
                </div>
                <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {item.data.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MendelianStudyComponent;
