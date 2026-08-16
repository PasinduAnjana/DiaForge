import { Node, NodeProps } from 'reactflow';
import { LucideIcon } from 'lucide-react';
import React from 'react';

export type NodeCategory = 
  | 'General'
  | 'Compute'
  | 'Database & Storage'
  | 'Network & Security'
  | 'Flowchart';

export interface DiaFlowNodeData {
  label: string;
  sublabel?: string;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  iconName?: string;
  shape?: 'rectangle' | 'diamond' | 'circle' | 'pill' | 'cylinder' | 'card' | 'container';
  [key: string]: unknown;
}

export type DiaFlowNode = Node<DiaFlowNodeData>;

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan' | 'emerald' | 'indigo' | 'zinc';
  description?: string;
  defaultDimensions?: { width: number; height: number };
  minDimensions?: { width: number; height: number };
  component: React.ComponentType<NodeProps>;
}
