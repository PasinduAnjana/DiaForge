import { Node, Edge, MarkerType } from 'reactflow';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  columnGap?: number;
  rowGap?: number;
  createContainers?: boolean;
}

/**
 * Detects if a diagram is Peter Chen's ER Diagram notation
 */
export function isERDiagram(nodes: Node[]): boolean {
  return nodes.some(
    (n) =>
      n.type?.startsWith('erd_') ||
      n.data?.shape === 'entity' ||
      n.data?.shape === 'relationship' ||
      n.data?.shape === 'attribute'
  );
}

/**
 * Formats Peter Chen's ER Diagrams with entities & relationships on a central backbone
 * and attributes clustered fanning out above/below each entity
 */
export function layoutERDElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const entityNodes = nodes.filter(
    (n) => n.type === 'erd_entity' || n.type === 'erd_weak_entity'
  );
  const relationshipNodes = nodes.filter(
    (n) => n.type === 'erd_relationship' || n.type === 'erd_weak_relationship'
  );
  const attributeNodes = nodes.filter(
    (n) =>
      n.type === 'erd_attribute' ||
      n.type === 'erd_key_attribute' ||
      n.type === 'erd_multivalued_attribute' ||
      n.type === 'erd_derived_attribute'
  );

  // Map each entity to its attached attributes based on edges
  const entityAttrMap = new Map<string, Node[]>();
  entityNodes.forEach((e) => entityAttrMap.set(e.id, []));

  edges.forEach((edge) => {
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);

    if (srcNode && tgtNode) {
      if (attributeNodes.some((a) => a.id === srcNode.id) && entityAttrMap.has(tgtNode.id)) {
        entityAttrMap.get(tgtNode.id)!.push(srcNode);
      } else if (attributeNodes.some((a) => a.id === tgtNode.id) && entityAttrMap.has(srcNode.id)) {
        entityAttrMap.get(srcNode.id)!.push(tgtNode);
      }
    }
  });

  const placedNodes: Node[] = [];
  const startX = 60;
  const backboneY = 220; // Center Y for Entities & Relationships
  const stepX = 260; // Distance between Entity and Relationship

  // Arrange backbone: Entity 1 -> Relationship -> Entity 2
  let currentX = startX;
  const backboneItems: Node[] = [];

  // Interleave entities and relationships
  const maxItems = Math.max(entityNodes.length, relationshipNodes.length);
  for (let i = 0; i < maxItems; i++) {
    if (i < entityNodes.length) backboneItems.push(entityNodes[i]);
    if (i < relationshipNodes.length) backboneItems.push(relationshipNodes[i]);
  }

  backboneItems.forEach((item) => {
    const isRel = item.type === 'erd_relationship' || item.type === 'erd_weak_relationship';
    const posY = isRel ? backboneY - 8 : backboneY;

    const placed: Node = {
      ...item,
      position: { x: currentX, y: posY },
      zIndex: 10,
    };
    placedNodes.push(placed);

    // Place attributes for entities
    if (!isRel && entityAttrMap.has(item.id)) {
      const attrs = entityAttrMap.get(item.id)!;
      const attrCount = attrs.length;

      attrs.forEach((attr, idx) => {
        // Fan out above
        const offset = (idx - (attrCount - 1) / 2) * 105;
        const attrX = currentX + offset;
        const attrY = backboneY - 120; // Positioned cleanly above

        placedNodes.push({
          ...attr,
          position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
          zIndex: 10,
        });
      });
    }

    currentX += stepX;
  });

  // Handle any remaining unattached nodes
  nodes.forEach((n) => {
    if (!placedNodes.some((p) => p.id === n.id)) {
      placedNodes.push({
        ...n,
        position: { x: currentX, y: backboneY },
        zIndex: 10,
      });
      currentX += stepX;
    }
  });

  // Clean, straight connections
  const nodeMap = new Map<string, Node>();
  placedNodes.forEach((n) => nodeMap.set(n.id, n));

  const styledEdges = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    let sourceHandle = edge.sourceHandle;
    let targetHandle = edge.targetHandle;

    if (sourceNode && targetNode && (!sourceHandle || !targetHandle)) {
      const isSrcAttr = sourceNode.type?.includes('attribute');
      const isTgtAttr = targetNode.type?.includes('attribute');

      if (isSrcAttr) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else if (isTgtAttr) {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      } else {
        const dx = targetNode.position.x - sourceNode.position.x;
        sourceHandle = dx >= 0 ? 'right' : 'left';
        targetHandle = dx >= 0 ? 'left' : 'right';
      }
    }

    return {
      ...edge,
      sourceHandle: sourceHandle || 'bottom',
      targetHandle: targetHandle || 'top',
      type: 'straight',
      data: {
        ...edge.data,
        isStraight: true,
      },
      animated: edge.animated ?? false,
      style: edge.style || { stroke: '#71717a', strokeWidth: 2 },
    };
  });

  return { nodes: placedNodes, edges: styledEdges };
}

/**
 * Classifies any node into a standard 5-tier architecture column (0 to 4)
 */
export function inferNodeTier(node: Node): number {
  if (typeof node.data?.tier === 'number' && node.data.tier >= 0 && node.data.tier <= 4) {
    return node.data.tier;
  }

  const type = (node.type || '').toLowerCase();
  const label = (node.data?.label || '').toLowerCase();
  const sublabel = (node.data?.sublabel || '').toLowerCase();
  const combined = `${type} ${label} ${sublabel}`;

  // Tier 0: Clients & Consumers
  if (
    combined.includes('client') ||
    combined.includes('mobile') ||
    combined.includes('ios') ||
    combined.includes('android') ||
    combined.includes('web') ||
    combined.includes('browser') ||
    combined.includes('iot') ||
    combined.includes('frontend') ||
    combined.includes('ui')
  ) {
    return 0;
  }

  // Tier 1: Ingress, CDN, DNS, Gateways, Load Balancers
  if (
    type === 'router' ||
    type === 'loadbalancer' ||
    type === 'firewall' ||
    combined.includes('gateway') ||
    combined.includes('cloudfront') ||
    combined.includes('cdn') ||
    combined.includes('dns') ||
    combined.includes('route53') ||
    combined.includes('waf') ||
    combined.includes('ingress') ||
    combined.includes('load balancer') ||
    combined.includes('alb') ||
    combined.includes('nginx')
  ) {
    return 1;
  }

  // Tier 4: External Integrations & Egress (Check before database/services)
  if (
    combined.includes('stripe') ||
    combined.includes('payment') ||
    combined.includes('twilio') ||
    combined.includes('sendgrid') ||
    combined.includes('datadog') ||
    combined.includes('prometheus') ||
    combined.includes('grafana') ||
    combined.includes('external') ||
    combined.includes('analytics') ||
    combined.includes('snowflake') ||
    combined.includes('bigquery')
  ) {
    return 4;
  }

  // Tier 3: Persistence, Databases, Caches, Storage, Queues
  if (
    type === 'database' ||
    type === 'cache' ||
    type === 'storage' ||
    type === 'queue' ||
    combined.includes('db') ||
    combined.includes('sql') ||
    combined.includes('postgres') ||
    combined.includes('mysql') ||
    combined.includes('mongo') ||
    combined.includes('dynamo') ||
    combined.includes('redis') ||
    combined.includes('memcached') ||
    combined.includes('s3') ||
    combined.includes('bucket') ||
    combined.includes('blob') ||
    combined.includes('kafka') ||
    combined.includes('sqs') ||
    combined.includes('rabbitmq') ||
    combined.includes('eventbridge')
  ) {
    return 3;
  }

  // Tier 2: Core Application Services, Microservices, Compute (Default)
  return 2;
}

/**
 * Enterprise Tiered Architecture Layout Engine
 * Places components into clear horizontal swimlanes with automatic VPC container grouping
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } => {
  // If this is an ER Diagram (Chen's Notation), format with specialized ERD layout
  if (isERDiagram(nodes)) {
    return layoutERDElements(nodes, edges);
  }

  const {
    columnGap = 160,
    rowGap = 44,
    createContainers = true,
  } = options;

  const nodeWidth = 180;
  const nodeHeight = 56;
  const colStep = nodeWidth + columnGap; // 340px between columns

  // Filter out existing container nodes to recompute clean boundaries
  const contentNodes = nodes.filter((n) => n.type !== 'container');

  if (contentNodes.length === 0) {
    return { nodes, edges };
  }

  // 1. Group nodes by their architectural tier (0..4)
  const tierBuckets: Record<number, Node[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

  contentNodes.forEach((node) => {
    const tier = inferNodeTier(node);
    tierBuckets[tier].push(node);
  });

  // Determine active columns (tiers with at least 1 node)
  const activeTiers = [0, 1, 2, 3, 4].filter((t) => tierBuckets[t].length > 0);

  // Find max nodes in any tier to calculate baseline vertical center
  const maxNodesInAnyTier = Math.max(...activeTiers.map((t) => tierBuckets[t].length), 1);
  const baselineHeight = maxNodesInAnyTier * (nodeHeight + rowGap);
  const centerY = Math.max(baselineHeight / 2, 200);

  const startX = 60;
  const placedNodes: Node[] = [];
  const vpcNodes: Node[] = []; // Nodes to envelop in VPC container (Tier 2 and Tier 3)

  // 2. Position nodes column by column
  activeTiers.forEach((tier, colIndex) => {
    const colX = startX + colIndex * colStep;
    const tierNodes = tierBuckets[tier];
    const colHeight = tierNodes.length * nodeHeight + (tierNodes.length - 1) * rowGap;
    const startY = Math.max(centerY - colHeight / 2, 60);

    tierNodes.forEach((node, rowIndex) => {
      const posY = startY + rowIndex * (nodeHeight + rowGap);
      const placed: Node = {
        ...node,
        position: {
          x: Math.round(colX / 8) * 8,
          y: Math.round(posY / 8) * 8,
        },
        zIndex: 10,
      };

      placedNodes.push(placed);

      // Track internal backend nodes for VPC container
      if (tier === 2 || tier === 3 || node.data?.group) {
        vpcNodes.push(placed);
      }
    });
  });

  // 3. Automatically generate multiple clean group containers (Subnets / VPC / Domains)
  const containerNodes: Node[] = [];

  if (createContainers) {
    // 3a. Check for explicit group names from AI or user
    const groupMap = new Map<string, Node[]>();

    placedNodes.forEach((n) => {
      const groupName = n.data?.group?.trim();
      if (groupName) {
        if (!groupMap.has(groupName)) groupMap.set(groupName, []);
        groupMap.get(groupName)!.push(n);
      }
    });

    // If explicit groups were specified, create a container for each group
    if (groupMap.size > 0) {
      let groupIdx = 0;
      const groupColors: Array<'indigo' | 'cyan' | 'emerald' | 'blue' | 'zinc' | 'purple'> = [
        'zinc',
        'indigo',
        'emerald',
        'cyan',
        'blue',
        'purple',
      ];

      groupMap.forEach((members, groupName) => {
        if (members.length >= 1) {
          const minX = Math.min(...members.map((n) => n.position.x)) - 28;
          const maxX = Math.max(...members.map((n) => n.position.x)) + nodeWidth + 28;
          const minY = Math.min(...members.map((n) => n.position.y)) - 52;
          const maxY = Math.max(...members.map((n) => n.position.y)) + nodeHeight + 28;

          const width = Math.max(maxX - minX, 240);
          const height = Math.max(maxY - minY, 140);
          const color = groupColors[groupIdx % groupColors.length];
          groupIdx++;

          containerNodes.push({
            id: `container_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${groupIdx}`,
            type: 'container',
            position: {
              x: Math.round(minX / 8) * 8,
              y: Math.round(minY / 8) * 8,
            },
            data: {
              label: groupName,
              color,
              width,
              height,
            },
            style: { width, height },
            zIndex: -1,
            draggable: true,
            selectable: true,
          });
        }
      });
    } else {
      // 3b. Automatic fallback: create modular containers for App Tier and Data Tier if distinct
      const tier2Nodes = tierBuckets[2];
      const tier3Nodes = tierBuckets[3];

      // If both App tier and Data tier exist with multiple nodes, separate them into 2 clear subnets!
      if (tier2Nodes.length >= 2 && tier3Nodes.length >= 2) {
        // App Services Subnet
        const appPl = placedNodes.filter((n) => inferNodeTier(n) === 2);
        const minX1 = Math.min(...appPl.map((n) => n.position.x)) - 28;
        const maxX1 = Math.max(...appPl.map((n) => n.position.x)) + nodeWidth + 28;
        const minY1 = Math.min(...appPl.map((n) => n.position.y)) - 52;
        const maxY1 = Math.max(...appPl.map((n) => n.position.y)) + nodeHeight + 28;

        containerNodes.push({
          id: 'container_app_tier',
          type: 'container',
          position: { x: Math.round(minX1 / 8) * 8, y: Math.round(minY1 / 8) * 8 },
          data: { label: 'Private Subnet (Application Services)', color: 'emerald', width: maxX1 - minX1, height: maxY1 - minY1 },
          style: { width: maxX1 - minX1, height: maxY1 - minY1 },
          zIndex: -1,
          draggable: true,
          selectable: true,
        });

        // Data & Persistence Subnet
        const dataPl = placedNodes.filter((n) => inferNodeTier(n) === 3);
        const minX2 = Math.min(...dataPl.map((n) => n.position.x)) - 28;
        const maxX2 = Math.max(...dataPl.map((n) => n.position.x)) + nodeWidth + 28;
        const minY2 = Math.min(...dataPl.map((n) => n.position.y)) - 52;
        const maxY2 = Math.max(...dataPl.map((n) => n.position.y)) + nodeHeight + 28;

        containerNodes.push({
          id: 'container_data_tier',
          type: 'container',
          position: { x: Math.round(minX2 / 8) * 8, y: Math.round(minY2 / 8) * 8 },
          data: { label: 'Isolated Persistence & Storage Tier', color: 'blue', width: maxX2 - minX2, height: maxY2 - minY2 },
          style: { width: maxX2 - minX2, height: maxY2 - minY2 },
          zIndex: -1,
          draggable: true,
          selectable: true,
        });
      } else if (vpcNodes.length >= 2) {
        // Unified VPC Container
        const minX = Math.min(...vpcNodes.map((n) => n.position.x)) - 32;
        const maxX = Math.max(...vpcNodes.map((n) => n.position.x)) + nodeWidth + 32;
        const minY = Math.min(...vpcNodes.map((n) => n.position.y)) - 56;
        const maxY = Math.max(...vpcNodes.map((n) => n.position.y)) + nodeHeight + 32;

        containerNodes.push({
          id: 'container_vpc',
          type: 'container',
          position: { x: Math.round(minX / 8) * 8, y: Math.round(minY / 8) * 8 },
          data: { label: 'AWS Cloud / VPC (Private Network)', color: 'zinc', width: Math.max(maxX - minX, 300), height: Math.max(maxY - minY, 200) },
          style: { width: Math.max(maxX - minX, 300), height: Math.max(maxY - minY, 200) },
          zIndex: -1,
          draggable: true,
          selectable: true,
        });
      }
    }
  }

  // 4. Assemble nodes: Containers in the back, nodes in front
  const finalNodes = [...containerNodes, ...placedNodes];

  // 5. Smart Connection Handles & Laser-straight smoothstep edge connections
  const nodeMap = new Map<string, Node>();
  placedNodes.forEach((n) => nodeMap.set(n.id, n));

  const styledEdges = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    let sourceHandle = edge.sourceHandle;
    let targetHandle = edge.targetHandle;

    if (sourceNode && targetNode && (!sourceHandle || !targetHandle)) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;

      // Target is downstream (to the right): connect Right -> Left
      if (dx >= 100) {
        sourceHandle = 'right';
        targetHandle = 'left';
      }
      // Target is upstream (to the left): connect Left -> Right
      else if (dx <= -100) {
        sourceHandle = 'left';
        targetHandle = 'right';
      }
      // In same column (Target is below): connect Bottom -> Top
      else if (dy > 40) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      }
      // In same column (Target is above): connect Top -> Bottom
      else if (dy < -40) {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      } else {
        sourceHandle = 'right';
        targetHandle = 'left';
      }
    }

    return {
      ...edge,
      sourceHandle: sourceHandle || 'right',
      targetHandle: targetHandle || 'left',
      type: edge.type || 'smoothstep',
      animated: edge.animated ?? true,
      style: edge.style || { stroke: '#a1a1aa', strokeWidth: 2 },
      markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
    };
  });

  return { nodes: finalNodes, edges: styledEdges };
};
