import React from "react";
import type { WorkspaceItem } from "../types";

interface TextAreaComponentProps {
  item: WorkspaceItem;
  editingTextId: string | null;
  editingText: string;
  setEditingTextId: (id: string | null) => void;
  setEditingText: (text: string) => void;
  items: WorkspaceItem[];
  setItems: (items: WorkspaceItem[]) => void;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
}

const TextAreaComponent: React.FC<TextAreaComponentProps> = ({
  item,
  editingTextId,
  editingText,
  setEditingTextId,
  setEditingText,
  items,
  setItems,
  onMouseDown,
}) => {
  const isEditing = editingTextId === item.id;

  const handleSaveText = () => {
    const updatedItems = items.map((i: WorkspaceItem) =>
      i.id === item.id ? { ...i, data: { ...i.data, content: editingText } } : i
    );
    setItems(updatedItems);
    setEditingTextId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingTextId(null);
    setEditingText("");
  };

  return (
    <div
      key={item.id}
      className={`absolute group ${isEditing ? "cursor-text" : "cursor-move"} ${
        isEditing
          ? "border-2 border-cyan-400 bg-white bg-opacity-80"
          : "border border-transparent hover:border-cyan-300"
      } rounded-md`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
        minHeight: "30px",
      }}
      onMouseDown={(e) => {
        if (isEditing) {
          e.stopPropagation();
        } else {
          onMouseDown(e, item.id);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingTextId(item.id);
        setEditingText(item.data?.content || "");
      }}
    >
      {isEditing ? (
        <textarea
          autoFocus
          className="w-full h-full resize-none border-none outline-none bg-transparent p-2"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={handleSaveText}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCancelEdit();
            } else if (e.key === "Enter" && e.ctrlKey) {
              handleSaveText();
            }
          }}
          style={{
            fontSize: item.data?.fontSize || 16,
            fontFamily: item.data?.fontFamily || "Arial",
            color: item.data?.color || "#000000",
            lineHeight: "1.5",
          }}
          placeholder="Type your text here..."
        />
      ) : (
        <div
          className="w-full h-full p-2 whitespace-pre-wrap break-words flex items-start"
          style={{
            fontSize: item.data?.fontSize || 16,
            fontFamily: item.data?.fontFamily || "Arial",
            color: item.data?.content
              ? item.data?.color || "#000000"
              : "#6b7280",
            lineHeight: "1.5",
            minHeight: "1.5em",
          }}
        >
          {item.data?.content || "Double-click to edit text"}
        </div>
      )}
    </div>
  );
};

export default TextAreaComponent;
