import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';
import { Layers } from 'lucide-react';

export const createContainerNode = ({
  defaultLabel = 'Group Container',
  color = 'zinc',
}: {
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const nodeColor = (data?.color as NodeColorTheme) || color;

    return (
      <BaseNode
        id={id}
        selected={selected}
        orientation={data?.orientation}
        color={nodeColor}
        minWidth={200}
        minHeight={150}
        showHandles={false}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div
          className={`w-full h-full rounded-xl border-2 border-dashed transition-colors p-3.5 flex flex-col justify-start min-w-[200px] min-h-[150px] ${
            selected
              ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100/40 dark:bg-zinc-900/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800/60 w-full">
            <Layers size={15} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 text-left"
                inputClassName="text-xs w-full text-left"
              />
            </div>
          </div>
        </div>
      </BaseNode>
    );
  };

  Component.displayName = `ContainerNode(${defaultLabel})`;
  return Component;
};

export default createContainerNode;
