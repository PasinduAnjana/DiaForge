import React from 'react';
import { NodeProps } from 'reactflow';
import {
  Server,
  Database,
  Box,
  Cloud,
  Globe,
  Zap,
  Cpu,
  Layers,
  HardDrive,
  Flame,
  ShieldCheck,
  KeyRound,
  Network,
  Split,
  MessageSquareCode,
  StickyNote,
  GitBranch,
  CircleDot,
  Square,
} from 'lucide-react';

import { NodeDefinition, NodeCategory } from './types';
import { createIconCardNode } from './templates/IconCardNode';
import { createCylinderNode } from './templates/CylinderNode';
import { createShapeNode } from './templates/ShapeNode';
import { createContainerNode } from './templates/ContainerNode';
import { createERDNode } from './templates/ERDNode';

// 1. Master List of Node Definitions
export const NODE_REGISTRY: NodeDefinition[] = [
  // --- General ---
  {
    type: 'custom',
    label: 'Custom Node',
    category: 'General',
    icon: Box,
    color: 'purple',
    description: 'Custom versatile node block',
    component: createIconCardNode({
      icon: Box,
      defaultLabel: 'Custom Node',
      color: 'purple',
      layout: 'horizontal',
    }),
  },
  {
    type: 'container',
    label: 'Group Container',
    category: 'General',
    icon: Layers,
    color: 'zinc',
    description: 'VPC, subnet or service boundary',
    component: createContainerNode({
      defaultLabel: 'Group Container',
      color: 'zinc',
    }),
  },
  {
    type: 'note',
    label: 'Note / Comment',
    category: 'General',
    icon: StickyNote,
    color: 'amber',
    description: 'Diagram annotation and note',
    component: createIconCardNode({
      icon: StickyNote,
      defaultLabel: 'Note',
      color: 'amber',
      layout: 'horizontal',
    }),
  },

  // --- Compute & Services ---
  {
    type: 'server',
    label: 'Server',
    category: 'Compute',
    icon: Server,
    color: 'green',
    description: 'Host, VM, or compute server',
    component: createIconCardNode({
      icon: Server,
      defaultLabel: 'Server',
      color: 'green',
      layout: 'horizontal',
    }),
  },
  {
    type: 'cloud',
    label: 'Cloud Instance',
    category: 'Compute',
    icon: Cloud,
    color: 'blue',
    description: 'Cloud VM / EC2 instance',
    component: createIconCardNode({
      icon: Cloud,
      defaultLabel: 'Cloud Instance',
      color: 'blue',
      layout: 'horizontal',
    }),
  },
  {
    type: 'microservice',
    label: 'Microservice',
    category: 'Compute',
    icon: Cpu,
    color: 'emerald',
    description: 'Independent service or worker',
    component: createIconCardNode({
      icon: Cpu,
      defaultLabel: 'Microservice',
      color: 'emerald',
      layout: 'horizontal',
    }),
  },
  {
    type: 'function',
    label: 'Serverless Function',
    category: 'Compute',
    icon: Zap,
    color: 'amber',
    description: 'Lambda or Cloud Function',
    component: createIconCardNode({
      icon: Zap,
      defaultLabel: 'Lambda Function',
      color: 'amber',
      layout: 'horizontal',
    }),
  },
  {
    type: 'api',
    label: 'API Service',
    category: 'Compute',
    icon: Globe,
    color: 'cyan',
    description: 'REST / GraphQL API endpoint',
    component: createIconCardNode({
      icon: Globe,
      defaultLabel: 'API Service',
      color: 'cyan',
      layout: 'horizontal',
    }),
  },

  // --- Database & Storage ---
  {
    type: 'database',
    label: 'SQL Database',
    category: 'Database & Storage',
    icon: Database,
    color: 'blue',
    description: 'Relational database cylinder',
    component: createCylinderNode({
      defaultLabel: 'Database',
      color: 'blue',
    }),
  },
  {
    type: 'cache',
    label: 'Cache / Redis',
    category: 'Database & Storage',
    icon: Flame,
    color: 'rose',
    description: 'In-memory cache store',
    component: createIconCardNode({
      icon: Flame,
      defaultLabel: 'Cache (Redis)',
      color: 'rose',
      layout: 'horizontal',
    }),
  },
  {
    type: 'storage',
    label: 'Object Storage',
    category: 'Database & Storage',
    icon: HardDrive,
    color: 'cyan',
    description: 'S3 bucket / Blob storage',
    component: createIconCardNode({
      icon: HardDrive,
      defaultLabel: 'Object Storage (S3)',
      color: 'cyan',
      layout: 'horizontal',
    }),
  },
  {
    type: 'queue',
    label: 'Message Queue',
    category: 'Database & Storage',
    icon: MessageSquareCode,
    color: 'indigo',
    description: 'Kafka, SQS, RabbitMQ broker',
    component: createIconCardNode({
      icon: MessageSquareCode,
      defaultLabel: 'Message Queue',
      color: 'indigo',
      layout: 'horizontal',
    }),
  },

  // --- Network & Security ---
  {
    type: 'router',
    label: 'Router / Gateway',
    category: 'Network & Security',
    icon: Network,
    color: 'cyan',
    description: 'Network router or API gateway',
    component: createIconCardNode({
      icon: Network,
      defaultLabel: 'API Gateway',
      color: 'cyan',
      layout: 'horizontal',
    }),
  },
  {
    type: 'loadbalancer',
    label: 'Load Balancer',
    category: 'Network & Security',
    icon: Split,
    color: 'indigo',
    description: 'Traffic distributor',
    component: createIconCardNode({
      icon: Split,
      defaultLabel: 'Load Balancer',
      color: 'indigo',
      layout: 'horizontal',
    }),
  },
  {
    type: 'firewall',
    label: 'Firewall / WAF',
    category: 'Network & Security',
    icon: ShieldCheck,
    color: 'rose',
    description: 'Security filter & firewall',
    component: createIconCardNode({
      icon: ShieldCheck,
      defaultLabel: 'Firewall / WAF',
      color: 'rose',
      layout: 'horizontal',
    }),
  },
  {
    type: 'auth',
    label: 'Auth / IAM',
    category: 'Network & Security',
    icon: KeyRound,
    color: 'amber',
    description: 'Authentication provider',
    component: createIconCardNode({
      icon: KeyRound,
      defaultLabel: 'Auth (OAuth/IAM)',
      color: 'amber',
      layout: 'horizontal',
    }),
  },

  // --- Flowchart ---
  {
    type: 'flow_process',
    label: 'Process Block',
    category: 'Flowchart',
    icon: Square,
    color: 'indigo',
    description: 'Standard flowchart step',
    component: createShapeNode({
      shape: 'process',
      defaultLabel: 'Process Step',
      color: 'indigo',
    }),
  },
  {
    type: 'flow_decision',
    label: 'Decision Diamond',
    category: 'Flowchart',
    icon: GitBranch,
    color: 'amber',
    description: 'Branching decision point',
    component: createShapeNode({
      shape: 'decision',
      defaultLabel: 'Decision?',
      color: 'amber',
    }),
  },
  {
    type: 'flow_terminal',
    label: 'Start / End Terminal',
    category: 'Flowchart',
    icon: CircleDot,
    color: 'emerald',
    description: 'Flowchart start or end point',
    component: createShapeNode({
      shape: 'terminal',
      defaultLabel: 'Start / End',
      color: 'emerald',
    }),
  },

  // --- ER Diagram (Chen's Notation) ---
  {
    type: 'erd_entity',
    label: 'Strong Entity',
    category: 'ER Diagram',
    icon: Square,
    color: 'indigo',
    description: 'Independent entity rectangle',
    component: createERDNode({
      shape: 'entity',
      defaultLabel: 'Entity',
      color: 'indigo',
    }),
  },
  {
    type: 'erd_weak_entity',
    label: 'Weak Entity',
    category: 'ER Diagram',
    icon: Layers,
    color: 'purple',
    description: 'Dependent entity double rectangle',
    component: createERDNode({
      shape: 'weak_entity',
      defaultLabel: 'Weak Entity',
      color: 'purple',
    }),
  },
  {
    type: 'erd_relationship',
    label: 'Relationship',
    category: 'ER Diagram',
    icon: GitBranch,
    color: 'amber',
    description: 'Relationship diamond',
    component: createERDNode({
      shape: 'relationship',
      defaultLabel: 'Relationship',
      color: 'amber',
    }),
  },
  {
    type: 'erd_weak_relationship',
    label: 'Identifying Relationship',
    category: 'ER Diagram',
    icon: GitBranch,
    color: 'rose',
    description: 'Weak relationship double diamond',
    component: createERDNode({
      shape: 'weak_relationship',
      defaultLabel: 'Relates To',
      color: 'rose',
    }),
  },
  {
    type: 'erd_key_attribute',
    label: 'Key Attribute (PK)',
    category: 'ER Diagram',
    icon: KeyRound,
    color: 'emerald',
    description: 'Primary key underlined ellipse',
    component: createERDNode({
      shape: 'key_attribute',
      defaultLabel: 'id (PK)',
      color: 'emerald',
    }),
  },
  {
    type: 'erd_attribute',
    label: 'Attribute',
    category: 'ER Diagram',
    icon: CircleDot,
    color: 'zinc',
    description: 'Standard attribute ellipse',
    component: createERDNode({
      shape: 'attribute',
      defaultLabel: 'attribute',
      color: 'zinc',
    }),
  },
  {
    type: 'erd_multivalued_attribute',
    label: 'Multivalued Attribute',
    category: 'ER Diagram',
    icon: Layers,
    color: 'cyan',
    description: 'Multivalued double ellipse',
    component: createERDNode({
      shape: 'multivalued_attribute',
      defaultLabel: 'multivalued',
      color: 'cyan',
    }),
  },
  {
    type: 'erd_derived_attribute',
    label: 'Derived Attribute',
    category: 'ER Diagram',
    icon: CircleDot,
    color: 'amber',
    description: 'Calculated dashed ellipse',
    component: createERDNode({
      shape: 'derived_attribute',
      defaultLabel: 'derived',
      color: 'amber',
    }),
  },
];

// 2. Automatically derive React Flow nodeTypes map
export const nodeTypes: Record<string, React.ComponentType<NodeProps>> = NODE_REGISTRY.reduce(
  (acc, def) => {
    acc[def.type] = def.component;
    return acc;
  },
  {} as Record<string, React.ComponentType<NodeProps>>
);

// Backward compatibility alias for legacy 'square'
const customNodeDef = NODE_REGISTRY.find((n) => n.type === 'custom');
if (customNodeDef) {
  nodeTypes['square'] = customNodeDef.component;
}

// 3. Category list
export const NODE_CATEGORIES: NodeCategory[] = [
  'General',
  'Compute',
  'Database & Storage',
  'Network & Security',
  'Flowchart',
  'ER Diagram',
];

// 4. Quick Lookup Helper
export const getNodeDefinition = (type: string): NodeDefinition | undefined => {
  return NODE_REGISTRY.find((node) => node.type === type);
};
