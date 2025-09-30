import React from "react";
import {
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { MendelianSimulationTraitResult } from "../../../types/api";
import type { WorkspaceItem } from "../types";
import { getAboGenotypeMap } from "../../dashboard/helpers";

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
  const simulationResults = (item.data?.simulationResults ?? null) as Record<
    string,
    MendelianSimulationTraitResult
  > | null;
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-indigo-500 ${
        item.data?.__justAdded ? "ring-4 ring-indigo-300 animate-pulse" : ""
      }`}
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
              {item.data.selectedTraits.map((trait: any, index: number) => {
                const isAbo = trait.key === "abo_blood_group";
                const genotypeMap = getAboGenotypeMap();
                const parent1 =
                  isAbo && trait.parent1Genotype
                    ? genotypeMap[trait.parent1Genotype] ||
                      trait.parent1Genotype
                    : trait.parent1Genotype;
                const parent2 =
                  isAbo && trait.parent2Genotype
                    ? genotypeMap[trait.parent2Genotype] ||
                      trait.parent2Genotype
                    : trait.parent2Genotype;
                return (
                  <div key={index} className="text-xs text-gray-600 mt-1">
                    {trait.name}: {parent1} × {parent2}
                  </div>
                );
              })}
            </div>
            {simulationResults && (
              <div className="space-y-2">
                <div className="font-medium">Results:</div>
                {Object.keys(simulationResults).map((traitKey) => {
                  const result = simulationResults[traitKey];
                  if (
                    !result ||
                    typeof result !== "object" ||
                    !result.genotypic_ratios ||
                    !result.phenotypic_ratios
                  ) {
                    return null;
                  }

                  const traitLabel =
                    item.data.selectedTraits.find(
                      (t: any) => t.key === traitKey
                    )?.name || traitKey;

                  return (
                    <div
                      key={traitKey}
                      className="bg-slate-50 p-2 rounded space-y-2"
                    >
                      <div className="font-medium text-xs mb-1">
                        {traitLabel}
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-blue-600 uppercase">
                          Genotypic
                        </div>
                        {traitKey === "abo_blood_group" ? (
                          <div className="grid grid-cols-3 gap-2 bg-blue-50/30 rounded-lg p-2 border border-blue-100 mb-2">
                            {(() => {
                              const genotypeMap: Record<string, string> = {
                                AA: "IᴬIᴬ",
                                AO: "Iᴬi",
                                BB: "IᴮIᴮ",
                                BO: "Iᴮi",
                                AB: "IᴬIᴮ",
                                OO: "ii",
                              };
                              const order = [
                                "AA",
                                "AO",
                                "BB",
                                "BO",
                                "AB",
                                "OO",
                              ];
                              return order.map((backendGenotype) => {
                                const percentage =
                                  result.genotypic_ratios[backendGenotype];
                                if (
                                  typeof percentage !== "number" ||
                                  Number.isNaN(percentage)
                                ) {
                                  return null;
                                }
                                const display = item.data.asPercentages
                                  ? `${percentage.toFixed(1)}%`
                                  : `${(percentage * 100).toFixed(1)}%`;
                                return (
                                  <div
                                    key={backendGenotype}
                                    className="flex flex-col items-center justify-center p-1"
                                  >
                                    <span
                                      style={{
                                        fontSize: "1.1em",
                                        fontWeight: 600,
                                        color: "#1e293b",
                                      }}
                                    >
                                      {genotypeMap[backendGenotype]}
                                    </span>
                                    <span className="text-xs font-semibold text-blue-600 mt-1">
                                      {display}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          Object.entries(result.genotypic_ratios).map(
                            ([genotype, percentage]) => {
                              if (
                                typeof percentage !== "number" ||
                                Number.isNaN(percentage)
                              ) {
                                return null;
                              }
                              const display = item.data.asPercentages
                                ? `${percentage.toFixed(1)}%`
                                : `${(percentage * 100).toFixed(1)}%`;
                              return (
                                <div
                                  key={genotype}
                                  className="flex justify-between text-xs"
                                >
                                  <span>{genotype}</span>
                                  <span className="font-mono">{display}</span>
                                </div>
                              );
                            }
                          )
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold text-green-600 uppercase">
                          Phenotypic
                        </div>
                        {Object.entries(result.phenotypic_ratios).map(
                          ([phenotype, percentage]) => {
                            if (
                              typeof percentage !== "number" ||
                              Number.isNaN(percentage)
                            ) {
                              return null;
                            }
                            const display = item.data.asPercentages
                              ? `${percentage.toFixed(1)}%`
                              : `${(percentage * 100).toFixed(1)}%`;
                            return (
                              <div
                                key={phenotype}
                                className="flex justify-between text-xs"
                              >
                                <span>{phenotype}</span>
                                <span className="font-mono">{display}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                })}
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
