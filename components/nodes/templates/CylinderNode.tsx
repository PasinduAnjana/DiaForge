import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';

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

export const createCylinderNode = ({
  defaultLabel = 'Database',
  color = 'blue',
}: {
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);

    const nodeColor = (data?.color as NodeColorTheme) || color;
    const themeStyles = COLOR_CLASSES[nodeColor] || COLOR_CLASSES.blue;

    const strokeClass = selected
      ? themeStyles.stroke
      : 'stroke-zinc-300 dark:stroke-zinc-700';

    return (
      <BaseNode
        id={id}
        selected={selected}
        orientation={data?.orientation}
        color={nodeColor}
        minWidth={110}
        minHeight={46}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div className="relative w-full h-full min-w-[110px] min-h-[46px] flex items-center justify-center px-3 py-1.5 drop-shadow-sm transition-all">
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

          {/* Centered Text Label */}
          <div className="relative z-10 flex items-center justify-center w-full pt-1.5 px-2">
            <EditableLabel
              id={id}
              initialLabel={data?.label}
              defaultLabel={defaultLabel}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className="text-zinc-800 dark:text-zinc-100 text-center font-medium truncate text-sm"
              inputClassName="text-center w-full font-medium text-sm"
            />
          </div>
        </div>
      </BaseNode>
    );
  };

  Component.displayName = `CylinderNode(${defaultLabel})`;
  return Component;
};

export default createCylinderNode;
