import React, { useState, useCallback } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { LucideIcon, Box } from 'lucide-react';
import { DiaFlowNodeData } from '../types';
import { getIconComponent } from '../icons/iconRegistry';
import { IconPickerModal } from '../icons/IconPickerModal';

export interface IconCardNodeProps extends NodeProps<DiaFlowNodeData> {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  defaultLabel?: string;
  color?: NodeColorTheme;
  layout?: 'horizontal' | 'vertical';
}

const BORDER_COLOR_MAP: Record<NodeColorTheme, { border: string; iconColor: string }> = {
  blue: { border: 'border-blue-500', iconColor: 'text-blue-500 dark:text-blue-400' },
  green: { border: 'border-green-500', iconColor: 'text-green-500 dark:text-green-400' },
  emerald: { border: 'border-emerald-500', iconColor: 'text-emerald-500 dark:text-emerald-400' },
  purple: { border: 'border-purple-500', iconColor: 'text-purple-500 dark:text-purple-400' },
  indigo: { border: 'border-indigo-500', iconColor: 'text-indigo-500 dark:text-indigo-400' },
  amber: { border: 'border-amber-500', iconColor: 'text-amber-500 dark:text-amber-400' },
  rose: { border: 'border-rose-500', iconColor: 'text-rose-500 dark:text-rose-400' },
  cyan: { border: 'border-cyan-500', iconColor: 'text-cyan-500 dark:text-cyan-400' },
  zinc: { border: 'border-zinc-400 dark:border-zinc-500', iconColor: 'text-zinc-500 dark:text-zinc-400' },
};

export const createIconCardNode = ({
  icon: DefaultIcon = Box,
  defaultLabel = 'Node',
  color = 'indigo',
  layout = 'horizontal',
  minWidth,
  minHeight,
}: {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  defaultLabel?: string;
  color?: NodeColorTheme;
  layout?: 'horizontal' | 'vertical';
  minWidth?: number;
  minHeight?: number;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeColor = (data?.color as NodeColorTheme) || color;
    const isHorizontalLayout = layout === 'horizontal';
    const themeStyles = BORDER_COLOR_MAP[nodeColor] || BORDER_COLOR_MAP.indigo;

    const defaultMinWidth = minWidth ?? (isHorizontalLayout ? 120 : 80);
    const defaultMinHeight = minHeight ?? (isHorizontalLayout ? 44 : 80);

    const ActiveIcon = getIconComponent(
      data?.iconName,
      DefaultIcon as LucideIcon
    );

    const handleSelectIcon = useCallback(
      (newIconName: string) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  iconName: newIconName,
                },
              };
            }
            return node;
          })
        );
      },
      [id, setNodes]
    );

    const handleSelectColor = useCallback(
      (newColor: NodeColorTheme) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  color: newColor,
                },
              };
            }
            return node;
          })
        );
      },
      [id, setNodes]
    );

    return (
      <>
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={defaultMinWidth}
          minHeight={defaultMinHeight}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full shadow-md rounded-lg bg-white dark:bg-zinc-900 border-2 transition-colors flex items-center justify-center p-3 gap-2.5 ${
              selected ? themeStyles.border : 'border-zinc-300 dark:border-zinc-700'
            } ${
              isHorizontalLayout
                ? 'flex-row min-w-[120px] min-h-[44px]'
                : 'flex-col min-w-[80px] min-h-[80px]'
            }`}
          >
            {/* Clickable Icon Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPickerOpen(true);
              }}
              className="p-1 -m-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer group/icon"
              title="Click to customize icon and color"
            >
              <ActiveIcon
                size={isHorizontalLayout ? 18 : 22}
                className={`${themeStyles.iconColor} shrink-0 transition-transform group-hover/icon:scale-115`}
              />
            </button>

            <div className="flex items-center justify-center min-w-0 max-w-full">
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-zinc-800 dark:text-zinc-100 text-center font-medium truncate"
                inputClassName="text-center w-full font-medium"
              />
            </div>
          </div>
        </BaseNode>

        {/* Searchable Icon & Color Picker Modal */}
        <IconPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectIcon={handleSelectIcon}
          currentIconName={data?.iconName}
          currentColor={nodeColor}
          onSelectColor={handleSelectColor}
        />
      </>
    );
  };

  Component.displayName = `IconCardNode(${defaultLabel})`;
  return Component;
};

export default createIconCardNode;
