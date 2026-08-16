import dagre from 'dagre';
import { Node, Edge, MarkerType } from 'reactflow';

export interface LayoutOptions {
  direction?: 'TB' | 'LR';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Automatically calculates clean layered positions for nodes and edges
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } => {
  const {
    direction = 'LR',
    nodeWidth = 160,
    nodeHeight = 60,
    rankSep = 100,
    nodeSep = 50,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 40,
    marginy: 40,
  });

  // Separate regular nodes and container nodes
  const regularNodes = nodes.filter((n) => n.type !== 'container');
  const containerNodes = nodes.filter((n) => n.type === 'container');

  regularNodes.forEach((node) => {
    const width = (node.width as number) || nodeWidth;
    const height = (node.height as number) || nodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = regularNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = (node.width as number) || nodeWidth;
    const height = (node.height as number) || nodeHeight;

    return {
      ...node,
      position: {
        x: Math.round((nodeWithPosition.x - width / 2) / 8) * 8,
        y: Math.round((nodeWithPosition.y - height / 2) / 8) * 8,
      },
    };
  });

  // Re-append container nodes behind regular nodes
  const finalNodes = [...containerNodes, ...layoutedNodes];

  const styledEdges = edges.map((edge) => ({
    ...edge,
    type: edge.type || 'smoothstep',
    animated: edge.animated ?? true,
    style: edge.style || { stroke: '#a1a1aa', strokeWidth: 2 },
    markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
  }));

  return { nodes: finalNodes, edges: styledEdges };
};
