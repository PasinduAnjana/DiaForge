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

const BADGE_COLOR_MAP: Record<NodeColorTheme, string> = {
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
    const badgeStyles = BADGE_COLOR_MAP[nodeColor] || BADGE_COLOR_MAP.indigo;

    const defaultMinWidth = minWidth ?? (isHorizontalLayout ? 130 : 85);
    const defaultMinHeight = minHeight ?? (isHorizontalLayout ? 46 : 85);

    const ActiveIcon = getIconComponent(
      data?.iconName,
      DefaultIcon as LucideIcon
    );

    const handleApplyAll = useCallback(
      ({
        iconName: newIconName,
        color: newColor,
        label: newLabel,
        badge: newBadge,
        description: newDescription,
      }: {
        iconName?: string;
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
                  iconName: newIconName || node.data?.iconName,
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
          minWidth={defaultMinWidth}
          minHeight={defaultMinHeight}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full shadow-md rounded-lg bg-white dark:bg-zinc-900 border-2 transition-colors flex items-center p-3 gap-2.5 ${
              selected ? themeStyles.border : 'border-zinc-300 dark:border-zinc-700'
            } ${
              isHorizontalLayout
                ? 'flex-row min-w-[130px] min-h-[46px]'
                : 'flex-col min-w-[85px] min-h-[85px] justify-center text-center'
            }`}
          >
            {/* Clickable Icon Button */}
            <button
              type="button"
              onClick={(e) => {
                if (e.currentTarget.closest('.is-presenting')) return;
                e.stopPropagation();
                setIsPickerOpen(true);
              }}
              className="p-1 -m-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer group/icon shrink-0"
              title="Click to customize badge, description, icon & color"
            >
              <ActiveIcon
                size={isHorizontalLayout ? 18 : 22}
                className={`${themeStyles.iconColor} shrink-0 transition-transform group-hover/icon:scale-115`}
              />
            </button>

            {/* Content Container (Title, Badge, Description) */}
            <div
              className={`flex flex-col min-w-0 max-w-full justify-center ${
                isHorizontalLayout ? 'items-start text-left' : 'items-center text-center'
              }`}
            >
              {/* Title */}
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className="text-zinc-800 dark:text-zinc-100 font-semibold truncate text-xs sm:text-sm"
                inputClassName="text-left w-full font-semibold text-xs sm:text-sm"
              />

              {/* Badge on a new line below Title */}
              {data?.badge && (
                <div className="mt-1">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPickerOpen(true);
                    }}
                    className={`inline-block text-[9px] leading-tight px-1.5 py-0.5 rounded-full font-semibold border ${badgeStyles} truncate max-w-[120px] cursor-pointer hover:opacity-85 shadow-2xs`}
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
                    setIsPickerOpen(true);
                  }}
                  className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight truncate max-w-[220px] mt-1 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  title={data.description || data.sublabel}
                >
                  {data.description || data.sublabel}
                </div>
              )}
            </div>
          </div>
        </BaseNode>

        {/* Searchable Icon, Details & Color Picker Modal */}
        <IconPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          currentIconName={data?.iconName}
          currentColor={nodeColor}
          currentLabel={data?.label || defaultLabel}
          currentBadge={data?.badge || ''}
          currentDescription={data?.description || data?.sublabel || ''}
          onApplyAll={handleApplyAll}
        />
      </>
    );
  };

  Component.displayName = `IconCardNode(${defaultLabel})`;
  return Component;
};

export default createIconCardNode;
