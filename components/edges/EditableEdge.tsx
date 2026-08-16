import React, { useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getStraightPath,
  EdgeProps,
  useReactFlow,
} from 'reactflow';

export const EditableEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}) => {
  const { setEdges } = useReactFlow();

  const isStraight =
    data?.isStraight ||
    data?.edgeType === 'straight' ||
    data?.type === 'straight';

  const [edgePath, labelX, labelY] = isStraight
    ? getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
      });

  const isEditingInitial = data?.isEditing || false;
  const currentLabel = label || data?.label || '';

  const [isEditing, setIsEditing] = useState(isEditingInitial);
  const [labelText, setLabelText] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize when data.isEditing changes externally (e.g. from onEdgeDoubleClick)
  useEffect(() => {
    if (data?.isEditing) {
      setIsEditing(true);
      setLabelText(currentLabel);
    }
  }, [data?.isEditing, currentLabel]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = labelText.trim();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            label: trimmed || undefined,
            data: {
              ...edge.data,
              label: trimmed,
              isEditing: false,
            },
          };
        }
        return edge;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setLabelText(currentLabel);
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id ? { ...edge, data: { ...edge.data, isEditing: false } } : edge
        )
      );
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* Edge Label / Inline Editor */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-20"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {isEditing ? (
            <div className="bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-indigo-500 p-0.5">
              <input
                ref={inputRef}
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                placeholder="Connection label..."
                className="px-2 py-0.5 text-[11px] font-medium bg-transparent outline-none text-zinc-900 dark:text-zinc-100 min-w-[80px] max-w-[180px] text-center"
              />
            </div>
          ) : currentLabel ? (
            <div
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all select-none cursor-pointer border shadow-2xs backdrop-blur-xs ${
                selected
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-400 dark:border-indigo-600'
                  : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
              title="Double-click to edit label"
            >
              {currentLabel}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default EditableEdge;
