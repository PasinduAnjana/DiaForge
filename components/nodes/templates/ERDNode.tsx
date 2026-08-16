import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode, NodeColorTheme } from '../base/BaseNode';
import { EditableLabel } from '../base/EditableLabel';
import { DiaFlowNodeData } from '../types';

export type ERDShapeType =
  | 'entity'
  | 'weak_entity'
  | 'relationship'
  | 'weak_relationship'
  | 'attribute'
  | 'key_attribute'
  | 'multivalued_attribute'
  | 'derived_attribute';

const COLOR_CLASSES: Record<
  NodeColorTheme,
  {
    border: string;
    bg: string;
    svgFill: string;
    svgInnerFill: string;
    stroke: string;
    text: string;
    underline: string;
  }
> = {
  indigo: {
    border: 'border-indigo-500/80 dark:border-indigo-400/80',
    bg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
    svgFill: 'fill-indigo-50/70 dark:fill-indigo-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
    text: 'text-indigo-950 dark:text-indigo-100',
    underline: 'decoration-indigo-600 dark:decoration-indigo-400',
  },
  blue: {
    border: 'border-blue-500/80 dark:border-blue-400/80',
    bg: 'bg-blue-50/70 dark:bg-blue-950/40',
    svgFill: 'fill-blue-50/70 dark:fill-blue-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-blue-600 dark:stroke-blue-400',
    text: 'text-blue-950 dark:text-blue-100',
    underline: 'decoration-blue-600 dark:decoration-blue-400',
  },
  emerald: {
    border: 'border-emerald-500/80 dark:border-emerald-400/80',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    svgFill: 'fill-emerald-50/70 dark:fill-emerald-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
    text: 'text-emerald-950 dark:text-emerald-100',
    underline: 'decoration-emerald-600 dark:decoration-emerald-400',
  },
  amber: {
    border: 'border-amber-500/80 dark:border-amber-400/80',
    bg: 'bg-amber-50/70 dark:bg-amber-950/40',
    svgFill: 'fill-amber-50/70 dark:fill-amber-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-amber-600 dark:stroke-amber-400',
    text: 'text-amber-950 dark:text-amber-100',
    underline: 'decoration-amber-600 dark:decoration-amber-400',
  },
  purple: {
    border: 'border-purple-500/80 dark:border-purple-400/80',
    bg: 'bg-purple-50/70 dark:bg-purple-950/40',
    svgFill: 'fill-purple-50/70 dark:fill-purple-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-purple-600 dark:stroke-purple-400',
    text: 'text-purple-950 dark:text-purple-100',
    underline: 'decoration-purple-600 dark:decoration-purple-400',
  },
  rose: {
    border: 'border-rose-500/80 dark:border-rose-400/80',
    bg: 'bg-rose-50/70 dark:bg-rose-950/40',
    svgFill: 'fill-rose-50/70 dark:fill-rose-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-rose-600 dark:stroke-rose-400',
    text: 'text-rose-950 dark:text-rose-100',
    underline: 'decoration-rose-600 dark:decoration-rose-400',
  },
  cyan: {
    border: 'border-cyan-500/80 dark:border-cyan-400/80',
    bg: 'bg-cyan-50/70 dark:bg-cyan-950/40',
    svgFill: 'fill-cyan-50/70 dark:fill-cyan-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-cyan-600 dark:stroke-cyan-400',
    text: 'text-cyan-950 dark:text-cyan-100',
    underline: 'decoration-cyan-600 dark:decoration-cyan-400',
  },
  green: {
    border: 'border-green-500/80 dark:border-green-400/80',
    bg: 'bg-green-50/70 dark:bg-green-950/40',
    svgFill: 'fill-green-50/70 dark:fill-green-950/40',
    svgInnerFill: 'fill-white dark:fill-zinc-900',
    stroke: 'stroke-green-600 dark:stroke-green-400',
    text: 'text-green-950 dark:text-green-100',
    underline: 'decoration-green-600 dark:decoration-green-400',
  },
  zinc: {
    border: 'border-zinc-300 dark:border-zinc-700',
    bg: 'bg-white dark:bg-zinc-900',
    svgFill: 'fill-white dark:fill-zinc-900',
    svgInnerFill: 'fill-zinc-50 dark:fill-zinc-950',
    stroke: 'stroke-zinc-400 dark:stroke-zinc-600',
    text: 'text-zinc-800 dark:text-zinc-200',
    underline: 'decoration-zinc-700 dark:decoration-zinc-300',
  },
};

export const createERDNode = ({
  shape = 'entity',
  defaultLabel = 'Entity',
  color = 'indigo',
}: {
  shape?: ERDShapeType;
  defaultLabel?: string;
  color?: NodeColorTheme;
}) => {
  const Component = ({ id, data, selected }: NodeProps<DiaFlowNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const nodeColor = (data?.color as NodeColorTheme) || color;
    const theme = COLOR_CLASSES[nodeColor] || COLOR_CLASSES.indigo;

    const isWeak = shape === 'weak_entity' || shape === 'weak_relationship';
    const isRelationship = shape === 'relationship' || shape === 'weak_relationship';

    // 1. Strong Entity (Crisp Modern Rectangle)
    if (shape === 'entity') {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={115}
          minHeight={46}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full min-w-[115px] min-h-[46px] rounded-lg border-2 flex items-center justify-center px-3 py-2 transition-all shadow-sm ${
              theme.bg
            } ${theme.border} ${
              selected ? 'ring-2 ring-indigo-500/30 scale-[1.02]' : ''
            }`}
          >
            <EditableLabel
              id={id}
              initialLabel={data?.label}
              defaultLabel={defaultLabel}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className={`font-bold text-center w-full text-xs sm:text-sm tracking-tight ${theme.text}`}
              inputClassName="w-full font-bold text-center text-xs sm:text-sm"
            />
          </div>
        </BaseNode>
      );
    }

    // 2. Weak Entity (Modern Double Border Rectangle)
    if (shape === 'weak_entity') {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={125}
          minHeight={52}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div
            className={`w-full h-full min-w-[125px] min-h-[52px] rounded-xl border-2 p-1 flex items-center justify-center transition-all shadow-sm ${
              theme.border
            } bg-white dark:bg-zinc-900 ${
              selected ? 'ring-2 ring-indigo-500/30 scale-[1.02]' : ''
            }`}
          >
            <div
              className={`w-full h-full rounded-lg border-1.5 flex items-center justify-center px-2 py-1.5 ${theme.border} ${theme.bg}`}
            >
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className={`font-bold text-center w-full text-xs sm:text-sm tracking-tight ${theme.text}`}
                inputClassName="w-full font-bold text-center text-xs sm:text-sm"
              />
            </div>
          </div>
        </BaseNode>
      );
    }

    // 3. Relationships (Geometric Diamond / Double Diamond)
    if (isRelationship) {
      return (
        <BaseNode
          id={id}
          selected={selected}
          orientation={data?.orientation}
          color={nodeColor}
          minWidth={115}
          minHeight={65}
          onDoubleClick={() => setIsEditing(true)}
        >
          <div className="relative w-full h-full min-w-[115px] min-h-[65px] flex items-center justify-center p-3 drop-shadow-sm">
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
            >
              {/* Outer Diamond */}
              <polygon
                points="50,2 98,30 50,58 2,30"
                className={`${theme.svgFill} ${theme.stroke} transition-colors`}
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Inner Diamond for Identifying Weak Relationship */}
              {isWeak && (
                <polygon
                  points="50,7 92,30 50,53 8,30"
                  className={`${theme.svgInnerFill} ${theme.stroke}`}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            <div className="relative z-10 w-full px-4 text-center">
              <EditableLabel
                id={id}
                initialLabel={data?.label}
                defaultLabel={defaultLabel}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                className={`font-semibold text-center w-full text-xs tracking-tight truncate ${theme.text}`}
                inputClassName="w-full font-semibold text-center text-xs"
              />
            </div>
          </div>
        </BaseNode>
      );
    }

    // 4. Attributes (Crisp Ellipses with PK Key Indicators)
    const isKey = shape === 'key_attribute';
    const isMultivalued = shape === 'multivalued_attribute';
    const isDerived = shape === 'derived_attribute';

    return (
      <BaseNode
        id={id}
        selected={selected}
        orientation={data?.orientation}
        color={nodeColor}
        minWidth={90}
        minHeight={42}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div className="relative w-full h-full min-w-[90px] min-h-[42px] flex items-center justify-center px-2 py-1 drop-shadow-xs">
          <svg
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            {/* Outer Ellipse */}
            <ellipse
              cx="50"
              cy="25"
              rx="48"
              ry="23"
              className={`${theme.svgFill} ${theme.stroke} transition-colors`}
              strokeWidth="1.75"
              strokeDasharray={isDerived ? '4 3' : undefined}
              vectorEffect="non-scaling-stroke"
            />
            {/* Inner Ellipse for Multivalued Attribute */}
            {isMultivalued && (
              <ellipse
                cx="50"
                cy="25"
                rx="42"
                ry="17"
                className={`fill-transparent ${theme.stroke}`}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          <div className="relative z-10 w-full px-2.5 text-center flex items-center justify-center gap-1">
            <EditableLabel
              id={id}
              initialLabel={data?.label}
              defaultLabel={defaultLabel}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              className={`font-medium text-center w-full text-xs truncate ${theme.text} ${
                isKey
                  ? `underline underline-offset-3 font-bold ${theme.underline}`
                  : isDerived
                  ? 'italic'
                  : ''
              }`}
              inputClassName="w-full font-medium text-center text-xs"
            />
          </div>
        </div>
      </BaseNode>
    );
  };

  Component.displayName = `ERDNode(${shape})`;
  return Component;
};

export default createERDNode;
