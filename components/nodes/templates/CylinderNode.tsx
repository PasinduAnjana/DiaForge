import React, { useState, useCallback } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';
import { IconPickerModal } from '../icons/IconPickerModal';

const COLOR_CLASSES: Record<
  NodeColorTheme,
  {
    border: string;
    lidBg: string;
    bodyBg: string;
    stroke: string;
  }
> = {
  blue: {
    border: 'border-blue-500',
    lidBg: 'fill-blue-50 dark:fill-blue-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-blue-500',
  },
  green: {
    border: 'border-green-500',
    lidBg: 'fill-green-50 dark:fill-green-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-green-500',
  },
  emerald: {
    border: 'border-emerald-500',
    lidBg: 'fill-emerald-50 dark:fill-emerald-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-emerald-500',
  },
  purple: {
    border: 'border-purple-500',
    lidBg: 'fill-purple-50 dark:fill-purple-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-purple-500',
  },
  indigo: {
    border: 'border-indigo-500',
    lidBg: 'fill-indigo-50 dark:fill-indigo-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-indigo-500',
  },
  amber: {
    border: 'border-amber-500',
    lidBg: 'fill-amber-50 dark:fill-amber-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-amber-500',
  },
  rose: {
    border: 'border-rose-500',
    lidBg: 'fill-rose-50 dark:fill-rose-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-rose-500',
  },
  cyan: {
    border: 'border-cyan-500',
    lidBg: 'fill-cyan-50 dark:fill-cyan-950/40',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-cyan-500',
  },
  zinc: {
    border: 'border-zinc-400 dark:border-zinc-500',
    lidBg: 'fill-zinc-100 dark:fill-zinc-800',
    bodyBg: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-zinc-400 dark:stroke-zinc-500',
  },
};

const BADGE_CLASSES: Record<NodeColorTheme, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-950/80 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  amber: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  zinc: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
};

export const createCylinderNode = ({
  defaultLabel = 'Database',
  color = 'blue',
}: {
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeColor = (data?.color as NodeColorTheme) || color;
    const themeStyles = COLOR_CLASSES[nodeColor] || COLOR_CLASSES.blue;
    const badgeStyles = BADGE_CLASSES[nodeColor] || BADGE_CLASSES.blue;

    const strokeClass = selected
      ? themeStyles.stroke
      : 'stroke-zinc-300 dark:stroke-zinc-700';

    const handleApplyAll = useCallback(
      ({
        color: newColor,
        label: newLabel,
        badge: newBadge,
        description: newDescription,
      }: {
        color?: NodeColorTheme;
        label?: string;
        badge?: string;
        description?: string;
      }) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  color: newColor || node.data?.color || color,
                  label: newLabel || defaultLabel,
                  badge: newBadge,
                  description: newDescription,
                  sublabel: newDescription,
                },
              };
            }
            return node;
          })
        );
      },
      [id, color, defaultLabel, setNodes]
    );

    return (
      <>
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={115}
          minHeight={50}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div className="relative w-full h-full min-w-[115px] min-h-[50px] flex items-center justify-center px-3 py-1.5 drop-shadow-sm transition-all">
            {/* Responsive Vector 3D Cylinder Background */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
            >
              {/* Cylinder Body */}
              <path
                d="M 2,14 L 2,46 C 2,54 98,54 98,46 L 98,14 Z"
                className={`${themeStyles.bodyBg} ${strokeClass} transition-colors`}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Cylinder Top Lid */}
              <ellipse
                cx="50"
                cy="14"
                rx="48"
                ry="11"
                className={`${themeStyles.lidBg} ${strokeClass} transition-colors`}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Content Container (Title, Badge, Description) */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full pt-2 px-1 text-center">
              {/* Title */}
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-zinc-800 dark:text-zinc-100 font-semibold truncate text-xs sm:text-sm text-center w-full"
                inputClassName="text-center w-full font-semibold text-xs sm:text-sm"
              />

              {/* Badge on a new line below Title */}
              {data?.badge && (
                <div className="mt-0.5">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className={`inline-block text-[9px] leading-tight px-1.5 py-0.5 rounded-full font-semibold border ${badgeStyles} truncate max-w-[100px] cursor-pointer hover:opacity-85 shadow-2xs`}
                    title={`Badge: ${data.badge} (Click to edit)`}
                  >
                    {data.badge}
                  </span>
                </div>
              )}

              {/* Optional Description / Subtitle */}
              {(data?.description || data?.sublabel) && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight truncate max-w-[160px] mt-0.5 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  title={data.description || data.sublabel}
                >
                  {data.description || data.sublabel}
                </div>
              )}
            </div>
          </div>
        </BaseNode>

        {/* Details & Color Customization Modal */}
        <IconPickerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentIconName="Database"
          currentColor={nodeColor}
          currentLabel={data?.label || defaultLabel}
          currentBadge={data?.badge || ''}
          currentDescription={data?.description || data?.sublabel || ''}
          onApplyAll={handleApplyAll}
        />
      </>
    );
  };

  Component.displayName = `CylinderNode(${defaultLabel})`;
  return Component;
};

export default createCylinderNode;
