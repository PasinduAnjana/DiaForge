import { z } from 'zod';
import type { Node, Edge, Viewport } from 'reactflow';

export const NodeColorThemeSchema = z.enum([
  'indigo',
  'purple',
  'blue',
  'cyan',
  'emerald',
  'green',
  'amber',
  'rose',
  'zinc',
]);

export const NodeDataSchema = z
  .object({
    label: z.string().optional(),
    sublabel: z.string().optional(),
    color: NodeColorThemeSchema.optional(),
    iconName: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    orientation: z.enum(['horizontal', 'vertical']).optional(),
  })
  .passthrough();

export const DiaFlowNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().default('custom'),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: NodeDataSchema.default({}),
    width: z.number().optional(),
    height: z.number().optional(),
    selected: z.boolean().optional(),
    draggable: z.boolean().optional(),
    selectable: z.boolean().optional(),
  })
  .passthrough();

export const DiaFlowEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    label: z.string().optional(),
    type: z.string().optional(),
    animated: z.boolean().optional(),
    style: z.record(z.string(), z.any()).optional(),
    markerEnd: z.any().optional(),
    data: z.record(z.string(), z.any()).optional(),
    selected: z.boolean().optional(),
  })
  .passthrough();

export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const DiaFlowDocumentSchema = z.object({
  version: z.string().default('1.0'),
  name: z.string().default('Untitled Architecture'),
  lastModified: z.string().optional(),
  nodes: z.array(DiaFlowNodeSchema).default([]),
  edges: z.array(DiaFlowEdgeSchema).default([]),
  viewport: ViewportSchema.optional(),
});

// AI Generation Output Schemas
export const AIGeneratedNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  color: NodeColorThemeSchema.optional(),
  iconName: z.string().optional(),
});

export const AIGeneratedEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  animated: z.boolean().optional(),
});

export const AIGeneratedDiagramSchema = z.object({
  name: z.string().default('AI Architecture'),
  summary: z.string().default(''),
  nodes: z.array(AIGeneratedNodeSchema).min(1, 'Diagram must contain at least 1 node'),
  edges: z.array(AIGeneratedEdgeSchema).default([]),
});

export const AIProviderSchema = z.enum(['grok', 'groq', 'openai']);

export const AIClientConfigSchema = z.object({
  provider: AIProviderSchema.optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export interface DiaFlowDocument {
  version: string;
  name: string;
  lastModified?: string;
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

export type AIGeneratedDiagram = z.infer<typeof AIGeneratedDiagramSchema>;
export type AIClientConfigZod = z.infer<typeof AIClientConfigSchema>;
