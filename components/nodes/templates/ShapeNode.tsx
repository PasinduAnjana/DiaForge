import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';

export type FlowchartShape = 'process' | 'decision' | 'terminal' | 'circle';

const COLOR_CLASSES: Record<
  NodeColorTheme,
  {
    border: string;
    stroke: string;
  }
> = {
  blue: { border: 'border-blue-500 shadow-blue-500/20', stroke: 'stroke-blue-500' },
  green: { border: 'border-green-500 shadow-green-500/20', stroke: 'stroke-green-500' },
  emerald: { border: 'border-emerald-500 shadow-emerald-500/20', stroke: 'stroke-emerald-500' },
  purple: { border: 'border-purple-500 shadow-purple-500/20', stroke: 'stroke-purple-500' },
  indigo: { border: 'border-indigo-500 shadow-indigo-500/20', stroke: 'stroke-indigo-500' },
  amber: { border: 'border-amber-500 shadow-amber-500/20', stroke: 'stroke-amber-500' },
  rose: { border: 'border-rose-500 shadow-rose-500/20', stroke: 'stroke-rose-500' },
  cyan: { border: 'border-cyan-500 shadow-cyan-500/20', stroke: 'stroke-cyan-500' },
  zinc: { border: 'border-zinc-400 dark:border-zinc-500 shadow-zinc-500/20', stroke: 'stroke-zinc-400 dark:stroke-zinc-500' },
};

export const createShapeNode = ({
  shape = 'process',
  defaultLabel = 'Process',
  color = 'indigo',
}: {
  shape?: FlowchartShape;
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const nodeColor = (data?.color as NodeColorTheme) || color;
    const activeTheme = COLOR_CLASSES[nodeColor] || COLOR_CLASSES.indigo;

    const borderColor = selected
      ? `${activeTheme.border} shadow-md`
      : 'border-zinc-300 dark:border-zinc-700';

    if (shape === 'decision') {
      const strokeClass = selected
        ? activeTheme.stroke
        : 'stroke-zinc-300 dark:stroke-zinc-700';

      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={80}
          minHeight={60}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-2 min-w-[80px] min-h-[60px]">
            {/* True Geometric Vector Diamond that scales responsively without distortion */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points="50,2 98,50 50,98 2,50"
                className={`fill-white dark:fill-zinc-900 transition-colors ${strokeClass}`}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Centered Label */}
            <div className="relative z-10 w-full px-4 flex justify-center max-w-[75%]">
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-xs text-zinc-800 dark:text-zinc-100 text-center font-semibold"
                inputClassName="text-xs w-full text-center"
              />
            </div>
          </div>
        </BaseNode>
      );
    }

    if (shape === 'circle') {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={70}
          minHeight={70}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full rounded-full bg-white dark:bg-zinc-900 border-2 ${borderColor} flex items-center justify-center p-2 min-w-[70px] min-h-[70px] shadow-sm transition-colors`}
          >
            <EditableLabel
              id={id}
              initialLabel={data?.label}
              defaultLabel={defaultLabel}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className="text-xs text-zinc-800 dark:text-zinc-100 text-center font-medium"
              inputClassName="text-xs w-full text-center"
            />
          </div>
        </BaseNode>
      );
    }

    if (shape === 'terminal') {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={110}
          minHeight={40}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full rounded-full bg-white dark:bg-zinc-900 border-2 ${borderColor} flex items-center justify-center px-4 py-2 min-w-[110px] min-h-[40px] shadow-sm transition-colors`}
          >
            <EditableLabel
              id={id}
              initialLabel={data?.label}
              defaultLabel={defaultLabel}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className="text-zinc-800 dark:text-zinc-100 text-center font-medium"
              inputClassName="w-full text-center"
            />
          </div>
        </BaseNode>
      );
    }

    // Default: Process Rectangle
    return (
      <BaseNode
        id={id}
        selected={selected}
        orientation={data?.orientation}
        color={nodeColor}
        minWidth={100}
        minHeight={48}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div
          className={`w-full h-full rounded-md bg-white dark:bg-zinc-900 border-2 ${borderColor} flex items-center justify-center px-4 py-2 min-w-[100px] min-h-[48px] shadow-sm transition-colors`}
        >
          <EditableLabel
            id={id}
            initialLabel={data?.label}
            defaultLabel={defaultLabel}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            className="text-zinc-800 dark:text-zinc-100 text-center font-medium"
            inputClassName="w-full text-center"
          />
        </div>
      </BaseNode>
    );
  };

  Component.displayName = `ShapeNode(${defaultLabel})`;
  return Component;
};

export default createShapeNode;
