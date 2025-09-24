import React from "react";
import { DocumentTextIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface NoteComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: string) => void;
  onNoteChange: (itemId: string, content: string) => void;
}

const NoteComponent: React.FC<NoteComponentProps> = ({
  item,
  commonClasses,
  onMouseDown,
  onDeleteItem,
  onNoteChange,
}) => {
  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-yellow-500`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-semibold text-sm">Note</span>
          </div>
          <button
            onClick={(e) => onDeleteItem(e, item.id)}
            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
            title="Delete note"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
        <textarea
          className="w-full h-16 text-xs border-none resize-none focus:outline-none"
          value={item.data?.content || ""}
          onChange={(e) => onNoteChange(item.id, e.target.value)}
          placeholder="Add your notes..."
        />
      </div>
    </div>
  );
};

export default NoteComponent;
