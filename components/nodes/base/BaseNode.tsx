import React, { useEffect } from 'react';
import { Handle, Position, NodeResizer, useUpdateNodeInternals } from 'reactflow';

export type NodeColorTheme = 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan' | 'emerald' | 'indigo' | 'zinc';

export interface BaseNodeProps {
  id: string;
  selected?: boolean;
  orientation?: 'horizontal' | 'vertical';
  color?: NodeColorTheme;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio?: boolean;
  onDoubleClick?: () => void;
  className?: string;
  children: React.ReactNode;
  showHandles?: boolean;
  targetPosition?: Position;
  sourcePosition?: Position;
}

const COLOR_MAP: Record<
  NodeColorTheme,
  {
    handleBg: string;
    borderSelected: string;
    shadowSelected: string;
    resizerLine: string;
    resizerHandle: string;
  }
> = {
  blue: {
    handleBg: '!bg-blue-500',
    borderSelected: 'border-blue-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]',
    resizerLine: '!border-blue-500/70',
    resizerHandle: '!border-blue-500',
  },
  green: {
    handleBg: '!bg-green-500',
    borderSelected: 'border-green-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]',
    resizerLine: '!border-green-500/70',
    resizerHandle: '!border-green-500',
  },
  emerald: {
    handleBg: '!bg-emerald-500',
    borderSelected: 'border-emerald-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    resizerLine: '!border-emerald-500/70',
    resizerHandle: '!border-emerald-500',
  },
  purple: {
    handleBg: '!bg-purple-500',
    borderSelected: 'border-purple-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]',
    resizerLine: '!border-purple-500/70',
    resizerHandle: '!border-purple-500',
  },
  indigo: {
    handleBg: '!bg-indigo-500',
    borderSelected: 'border-indigo-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]',
    resizerLine: '!border-indigo-500/70',
    resizerHandle: '!border-indigo-500',
  },
  amber: {
    handleBg: '!bg-amber-500',
    borderSelected: 'border-amber-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    resizerLine: '!border-amber-500/70',
    resizerHandle: '!border-amber-500',
  },
  rose: {
    handleBg: '!bg-rose-500',
    borderSelected: 'border-rose-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    resizerLine: '!border-rose-500/70',
    resizerHandle: '!border-rose-500',
  },
  cyan: {
    handleBg: '!bg-cyan-500',
    borderSelected: 'border-cyan-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]',
    resizerLine: '!border-cyan-500/70',
    resizerHandle: '!border-cyan-500',
  },
  zinc: {
    handleBg: '!bg-zinc-500',
    borderSelected: 'border-zinc-400 dark:border-zinc-500',
    shadowSelected: 'drop-shadow-[0_0_8px_rgba(113,113,122,0.3)]',
    resizerLine: '!border-zinc-400 dark:!border-zinc-600',
    resizerHandle: '!border-zinc-500',
  },
};

export const BaseNode = ({
  id,
  selected = false,
  orientation = 'vertical',
  color = 'indigo',
  minWidth = 60,
  minHeight = 40,
  maxWidth,
  maxHeight,
  keepAspectRatio = false,
  onDoubleClick,
  className = '',
  children,
  showHandles = true,
  targetPosition,
  sourcePosition,
}: BaseNodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const isHorizontal = orientation === 'horizontal';

  useEffect(() => {
    updateNodeInternals(id);
  }, [isHorizontal, id, updateNodeInternals]);

  const targetPos = targetPosition || (isHorizontal ? Position.Left : Position.Top);
  const sourcePos = sourcePosition || (isHorizontal ? Position.Right : Position.Bottom);
  const theme = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        keepAspectRatio={keepAspectRatio}
        lineClassName={theme.resizerLine}
        handleClassName={`!w-2 !h-2 !bg-white dark:!bg-zinc-900 !border-2 ${theme.resizerHandle} !rounded-sm`}
      />
      <div
        onDoubleClick={onDoubleClick}
        className={`relative w-full h-full transition-all ${className}`}
      >
        {showHandles && (
          <Handle
            type="target"
            position={targetPos}
            className={`!w-3 !h-3 ${theme.handleBg} !border-none z-40`}
          />
        )}
        
        {children}

        {showHandles && (
          <Handle
            type="source"
            position={sourcePos}
            className={`!w-3 !h-3 ${theme.handleBg} !border-none z-40`}
          />
        )}
      </div>
    </>
  );
};

export default BaseNode;
