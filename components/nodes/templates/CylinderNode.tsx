import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { LucideIcon, Database } from 'lucide-react';
import { DiaFlowNodeData } from '../types';

export const createCylinderNode = ({
  icon: DefaultIcon = Database,
  defaultLabel = 'Database',
  color = 'blue',
}: {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const nodeColor = (data?.color as NodeColorTheme) || color;

    const borderColor = selected
      ? nodeColor === 'blue'
        ? 'border-blue-500'
        : nodeColor === 'emerald'
        ? 'border-emerald-500'
        : 'border-indigo-500'
      : 'border-zinc-300 dark:border-zinc-700';

    return (
      <BaseNode
        id={id}
        selected={selected}
        orientation={data?.orientation}
        color={nodeColor}
        minWidth={100}
        minHeight={110}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div
          className={`relative w-full h-full min-w-[100px] min-h-[110px] flex flex-col items-center justify-center font-sans transition-all ${
            selected ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'drop-shadow-md'
          }`}
        >
          {/* Top Ellipse (Lid) */}
          <div
            className={`absolute top-0 left-0 w-full h-10 z-20 transition-colors border-2 rounded-[50%] bg-zinc-100 dark:bg-zinc-800 ${borderColor}`}
          />

          {/* Body */}
          <div
            className={`absolute left-0 w-full z-10 flex flex-col items-center justify-center transition-colors border-x-2 bg-white dark:bg-zinc-900 ${borderColor}`}
            style={{ top: '20px', bottom: '20px' }}
          >
            <DefaultIcon size={18} className="text-blue-500 dark:text-blue-400 mt-3 mb-1 shrink-0" />
            <div className="w-full px-2 flex justify-center">
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-zinc-800 dark:text-zinc-100 text-center w-full"
                inputClassName="w-full font-medium"
              />
            </div>
          </div>

          {/* Bottom Ellipse */}
          <div
            className={`absolute bottom-0 left-0 w-full h-10 z-0 transition-colors border-2 rounded-[50%] bg-white dark:bg-zinc-900 ${borderColor}`}
          />
        </div>
      </BaseNode>
    );
  };

  Component.displayName = `CylinderNode(${defaultLabel})`;
  return Component;
};

export default createCylinderNode;
