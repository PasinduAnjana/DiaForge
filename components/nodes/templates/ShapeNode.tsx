import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';

export type FlowchartShape = 'process' | 'decision' | 'terminal' | 'circle';

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

    const borderColor = selected ? 'border-indigo-500 shadow-md shadow-indigo-500/20' : 'border-zinc-300 dark:border-zinc-700';

    if (shape === 'decision') {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={90}
          minHeight={90}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-2 min-w-[90px] min-h-[90px]">
            {/* Diamond Background */}
            <div
              className={`absolute inset-2 bg-white dark:bg-zinc-900 border-2 ${borderColor} rotate-45 rounded-sm transition-colors shadow-sm`}
            />
            {/* Centered Label */}
            <div className="relative z-10 w-full px-2 flex justify-center">
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
