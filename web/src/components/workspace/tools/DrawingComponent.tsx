import React, { useRef, useCallback, useState, useEffect } from "react";
import { PencilIcon, TrashIcon, SwatchIcon } from "@heroicons/react/24/outline";
import type { WorkspaceItem } from "../types";

interface DrawingComponentProps {
  item: WorkspaceItem;
  commonClasses: string;
  editingItemNameId: string | null;
  editingItemName: string;
  setEditingItemName: (name: string) => void;
  onMouseDown: (e: React.MouseEvent, itemId: string) => void;
  onNameClick: (
    e: React.MouseEvent,
    itemId: string,
    currentName: string
  ) => void;
  onNameSave: (itemId: string, newName: string) => void;
  onNameCancel: () => void;
  onEditItem: (itemId: string, field: string, value: any) => void;
  onDeleteItem: (itemId: string) => void;
}

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  strokeColor: string;
  strokeWidth: number;
}

const DrawingComponent: React.FC<DrawingComponentProps> = ({
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const data = item.data || {
    paths: [],
    strokeColor: "#000000",
    strokeWidth: 2,
    backgroundColor: "transparent",
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      setIsDrawing(false);
      setCurrentPath(null);
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (!svgRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure coordinates are within bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const newPath: DrawingPath = {
        id: `path-${Date.now()}`,
        points: [{ x, y }],
        strokeColor: data.strokeColor,
        strokeWidth: data.strokeWidth,
      };

      setCurrentPath(newPath);
      setIsDrawing(true);
    },
    [data.strokeColor, data.strokeWidth]
  );
  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !currentPath || !svgRef.current) return;

      e.preventDefault();

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure coordinates are within bounds
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      // Only add point if there's meaningful movement (optimization)
      const lastPoint = currentPath.points[currentPath.points.length - 1];
      if (
        lastPoint &&
        Math.abs(x - lastPoint.x) < 2 &&
        Math.abs(y - lastPoint.y) < 2
      ) {
        return; // Skip point if movement is too small
      }

      setCurrentPath((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, { x, y }],
        };
      });
    },
    [isDrawing, currentPath]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentPath) return;

    // Only save path if it has more than one point
    if (currentPath.points.length > 1) {
      const newPaths = [...(data.paths || []), currentPath];

      // Limit the number of paths to prevent memory issues (keep last 100 paths)
      const limitedPaths =
        newPaths.length > 100 ? newPaths.slice(-100) : newPaths;

      onEditItem(item.id, "paths", limitedPaths);
    }

    setIsDrawing(false);
    setCurrentPath(null);
  }, [isDrawing, currentPath, data.paths, onEditItem, item.id]);

  // Create smooth SVG path string from points using quadratic curves
  const createPathString = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let pathString = `M ${points[0].x} ${points[0].y}`;

    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;

      pathString += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
    }

    // Add the last point
    const lastPoint = points[points.length - 1];
    pathString += ` L ${lastPoint.x} ${lastPoint.y}`;

    return pathString;
  };
  const clearDrawing = useCallback(() => {
    onEditItem(item.id, "paths", []);
  }, [onEditItem, item.id]);

  const changeStrokeColor = useCallback(
    (color: string) => {
      onEditItem(item.id, "strokeColor", color);
      setShowColorPicker(false);
    },
    [onEditItem, item.id]
  );

  const changeStrokeWidth = useCallback(
    (width: number) => {
      onEditItem(item.id, "strokeWidth", width);
    },
    [onEditItem, item.id]
  );

  const predefinedColors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#800000",
    "#808080",
  ];

  return (
    <div
      key={item.id}
      className={`${commonClasses} border-l-4 border-l-red-500 bg-white`}
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
      }}
      onMouseDown={(e) => onMouseDown(e, item.id)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-red-50 border-b">
        <div className="flex items-center space-x-2">
          <PencilIcon className="h-4 w-4 text-red-600" />
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
              className="text-sm font-medium bg-transparent border-none outline-none text-red-800"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-medium text-red-800 cursor-pointer hover:underline"
              onClick={(e) => onNameClick(e, item.id, "Drawing")}
            >
              Drawing
            </span>
          )}
        </div>
        <button
          onClick={() => onDeleteItem(item.id)}
          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Drawing Tools */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: data.strokeColor }}
              title="Change color"
            >
              <SwatchIcon className="h-3 w-3 text-white opacity-50" />
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 z-10 p-2 bg-white border rounded-lg shadow-lg">
                <div className="grid grid-cols-4 gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => changeStrokeColor(color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">Width:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={data.strokeWidth}
              onChange={(e) => changeStrokeWidth(parseInt(e.target.value))}
              className="w-16"
            />
            <span className="text-xs text-gray-600 w-4">
              {data.strokeWidth}
            </span>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearDrawing}
          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Drawing Canvas */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e: React.TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation(),
            } as unknown as React.MouseEvent;
            startDrawing(mouseEvent);
          }}
          onTouchMove={(e: React.TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation(),
            } as unknown as React.MouseEvent;
            draw(mouseEvent);
          }}
          onTouchEnd={(e: React.TouchEvent) => {
            e.preventDefault();
            stopDrawing();
          }}
          style={{ backgroundColor: data.backgroundColor, touchAction: "none" }}
        >
          {/* Render saved paths */}
          {data.paths?.map((path: DrawingPath) => (
            <path
              key={path.id}
              d={createPathString(path.points)}
              stroke={path.strokeColor}
              strokeWidth={path.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Render current drawing path */}
          {currentPath && (
            <path
              d={createPathString(currentPath.points)}
              stroke={currentPath.strokeColor}
              strokeWidth={currentPath.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export default DrawingComponent;
