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
 * Formats Peter Chen's ER Diagrams in a clean 2D snake-grid layout (max 2 entities per row)
 * to fit comfortably in a single screen frame without excessive horizontal stretching
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

  // 1. Map each entity to its attached attributes based on edges
  const entityAttrMap = new Map<string, Node[]>();
  entityNodes.forEach((e) => entityAttrMap.set(e.id, []));

  const allEdges = [...edges];

  edges.forEach((edge) => {
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);

    if (srcNode && tgtNode) {
      if (attributeNodes.some((a) => a.id === srcNode.id) && entityAttrMap.has(tgtNode.id)) {
        if (!entityAttrMap.get(tgtNode.id)!.some((n) => n.id === srcNode.id)) {
          entityAttrMap.get(tgtNode.id)!.push(srcNode);
        }
      } else if (attributeNodes.some((a) => a.id === tgtNode.id) && entityAttrMap.has(srcNode.id)) {
        if (!entityAttrMap.get(srcNode.id)!.some((n) => n.id === tgtNode.id)) {
          entityAttrMap.get(srcNode.id)!.push(tgtNode);
        }
      }
    }
  });

  // Intelligent Auto-Attachment for orphaned attributes (e.g. if AI omitted edges)
  const attachedAttrIds = new Set<string>();
  entityAttrMap.forEach((attrs) => attrs.forEach((a) => attachedAttrIds.add(a.id)));

  attributeNodes.forEach((attr) => {
    if (!attachedAttrIds.has(attr.id)) {
      const attrLabel = (attr.data?.label || attr.id).toLowerCase();

      let matchedEntity = entityNodes.find((ent) => {
        const entLabel = (ent.data?.label || ent.id).toLowerCase();
        return (
          attrLabel.startsWith(entLabel) ||
          attrLabel.includes(entLabel) ||
          attr.id.toLowerCase().includes(ent.id.toLowerCase())
        );
      });

      if (!matchedEntity && entityNodes.length > 0) {
        const attrIndex = nodes.findIndex((n) => n.id === attr.id);
        const precedingEntities = entityNodes.filter(
          (ent) => nodes.findIndex((n) => n.id === ent.id) < attrIndex
        );
        matchedEntity = precedingEntities.length > 0
          ? precedingEntities[precedingEntities.length - 1]
          : entityNodes[0];
      }

      if (matchedEntity) {
        entityAttrMap.get(matchedEntity.id)!.push(attr);
        attachedAttrIds.add(attr.id);

        allEdges.push({
          id: `auto_e_${attr.id}_${matchedEntity.id}`,
          source: attr.id,
          target: matchedEntity.id,
          type: 'straight',
          animated: false,
          data: { isStraight: true },
        });
      }
    }
  });

  // 2. Ensure all consecutive entities have relationship diamonds between them
  const finalRelationshipNodes = [...relationshipNodes];

  if (entityNodes.length >= 2 && finalRelationshipNodes.length === 0) {
    for (let i = 0; i < entityNodes.length - 1; i++) {
      const e1 = entityNodes[i];
      const e2 = entityNodes[i + 1];
      const l1 = (e1.data?.label || e1.id).toLowerCase();
      const l2 = (e2.data?.label || e2.id).toLowerCase();

      let relName = 'Relates';
      if (l1.includes('cust') && l2.includes('order')) relName = 'Places';
      else if (l1.includes('order') && l2.includes('prod')) relName = 'Contains';
      else if (l1.includes('supp') && l2.includes('prod')) relName = 'Supplies';
      else if (l1.includes('prod') && l2.includes('supp')) relName = 'Supplied By';
      else if (l1.includes('stud') && l2.includes('course')) relName = 'Enrolls';
      else if (l1.includes('inst') && l2.includes('course')) relName = 'Teaches';

      const relId = `auto_rel_${e1.id}_${e2.id}`;
      const relNode: Node = {
        id: relId,
        type: 'erd_relationship',
        position: { x: 0, y: 0 },
        data: {
          label: relName,
          color: 'amber',
          shape: 'relationship',
        },
      };

      finalRelationshipNodes.push(relNode);
    }
  }

  // Interleave entities and relationships in order: E0 -> R0 -> E1 -> R1 -> E2 -> R2 -> E3 ...
  const backboneChain: Node[] = [];
  for (let i = 0; i < entityNodes.length; i++) {
    backboneChain.push(entityNodes[i]);
    if (i < finalRelationshipNodes.length) {
      backboneChain.push(finalRelationshipNodes[i]);
    }
  }

  // Ensure relationship edges exist in chain
  for (let i = 0; i < backboneChain.length - 1; i++) {
    const current = backboneChain[i];
    const next = backboneChain[i + 1];
    const hasEdge = allEdges.some(
      (e) =>
        (e.source === current.id && e.target === next.id) ||
        (e.source === next.id && e.target === current.id)
    );

    if (!hasEdge) {
      allEdges.push({
        id: `auto_chain_e_${current.id}_${next.id}`,
        source: current.id,
        target: next.id,
        label: i % 2 === 0 ? '1' : 'N',
        type: 'straight',
        animated: false,
        data: { isStraight: true },
      });
    }
  }

  const placedNodes: Node[] = [];
  const ENTITIES_PER_ROW = 2; // Clean 2D frame wrap

  // Calculate maximum fan width per column
  let maxCol0Span = 200;
  let maxCol1Span = 200;

  entityNodes.forEach((entity, idx) => {
    const row = Math.floor(idx / ENTITIES_PER_ROW);
    const inRowIdx = idx % ENTITIES_PER_ROW;
    const col = row % 2 === 0 ? inRowIdx : ENTITIES_PER_ROW - 1 - inRowIdx;
    const attrs = entityAttrMap.get(entity.id) || [];
    const topCount = attrs.length <= 3 ? attrs.length : Math.ceil(attrs.length / 2);
    const effectiveSpan = Math.min(topCount, 4) * 105;
    if (col === 0) maxCol0Span = Math.max(maxCol0Span, effectiveSpan);
    else maxCol1Span = Math.max(maxCol1Span, effectiveSpan);
  });

  const colDistance = Math.max((maxCol0Span + maxCol1Span) / 2 + 280, 960);
  const startX = Math.max(maxCol0Span / 2 + 60, 240);
  const colPositions = [startX, startX + colDistance];
  const relCenterX = startX + colDistance / 2;
  const rowYStep = 580; // Ample vertical room for top/bottom attribute tiers and diamonds
  const baseY = 240;

  // Position Entities in 2D Snake Grid (Row 0: Left->Right, Row 1: Right->Left, Row 2: Left->Right)
  const entityPositions = new Map<string, { x: number; y: number; row: number; col: number }>();

  entityNodes.forEach((entity, idx) => {
    const row = Math.floor(idx / ENTITIES_PER_ROW);
    const inRowIdx = idx % ENTITIES_PER_ROW;
    // Reverse direction on odd rows for a snake-like wrap
    const col = row % 2 === 0 ? inRowIdx : ENTITIES_PER_ROW - 1 - inRowIdx;
    const posX = colPositions[col];
    const posY = baseY + row * rowYStep;

    entityPositions.set(entity.id, { x: posX, y: posY, row, col });

    placedNodes.push({
      ...entity,
      position: { x: posX - 60, y: posY },
      zIndex: 10,
    });

    // Place attributes for this entity (balanced above & below with multi-tier fanning)
    if (entityAttrMap.has(entity.id)) {
      const attrs = entityAttrMap.get(entity.id)!;
      const count = attrs.length;

      let topAttrs: Node[] = [];
      let bottomAttrs: Node[] = [];

      if (count <= 3) {
        topAttrs = attrs;
      } else {
        const half = Math.ceil(count / 2);
        topAttrs = attrs.slice(0, half);
        bottomAttrs = attrs.slice(half);
      }

      // Fan out top attributes (compact tiered rows if > 4 attributes)
      const topCount = topAttrs.length;
      if (topCount <= 4) {
        topAttrs.forEach((attr, aIdx) => {
          const offset = (aIdx - (topCount - 1) / 2) * 105;
          const attrX = posX + offset - 45;
          const arch = Math.abs(offset) * 0.06;
          const attrY = posY - 105 + arch;

          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });
      } else {
        // 2-tier top fan
        const tier1 = topAttrs.slice(0, 3);
        const tier2 = topAttrs.slice(3);

        tier1.forEach((attr, aIdx) => {
          const offset = (aIdx - 1) * 105;
          const attrX = posX + offset - 45;
          const attrY = posY - 95;
          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });

        const t2Count = tier2.length;
        tier2.forEach((attr, aIdx) => {
          const offset = (aIdx - (t2Count - 1) / 2) * 105;
          const attrX = posX + offset - 45;
          const attrY = posY - 175;
          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });
      }

      // Fan out bottom attributes (compact tiered rows if > 4 attributes)
      const bottomCount = bottomAttrs.length;
      if (bottomCount <= 4) {
        bottomAttrs.forEach((attr, bIdx) => {
          const offset = (bIdx - (bottomCount - 1) / 2) * 105;
          const attrX = posX + offset - 45;
          const arch = Math.abs(offset) * 0.06;
          const attrY = posY + 85 - arch;

          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });
      } else {
        // 2-tier bottom fan
        const tier1 = bottomAttrs.slice(0, 3);
        const tier2 = bottomAttrs.slice(3);

        tier1.forEach((attr, bIdx) => {
          const offset = (bIdx - 1) * 105;
          const attrX = posX + offset - 45;
          const attrY = posY + 85;
          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });

        const t2Count = tier2.length;
        tier2.forEach((attr, bIdx) => {
          const offset = (bIdx - (t2Count - 1) / 2) * 105;
          const attrX = posX + offset - 45;
          const attrY = posY + 165;
          placedNodes.push({
            ...attr,
            position: { x: Math.round(attrX / 8) * 8, y: Math.round(attrY / 8) * 8 },
            zIndex: 10,
          });
        });
      }
    }
  });

  // Position Relationship Diamonds
  finalRelationshipNodes.forEach((rel, rIdx) => {
    const e1Pos = rIdx < entityNodes.length ? entityPositions.get(entityNodes[rIdx].id) : null;
    const e2Pos = rIdx + 1 < entityNodes.length ? entityPositions.get(entityNodes[rIdx + 1].id) : null;

    let posX = relCenterX;
    let posY = baseY;

    if (e1Pos && e2Pos) {
      if (e1Pos.row === e2Pos.row) {
        posX = relCenterX;
        posY = e1Pos.y - 8;
      } else {
        // Vertical transition between rows -> align with the column X
        posX = e1Pos.x;
        posY = (e1Pos.y + e2Pos.y) / 2 - 8;
      }
    } else if (e1Pos) {
      posX = e1Pos.col === 0 ? e1Pos.x + 320 : e1Pos.x - 320;
      posY = e1Pos.y - 8;
    }

    placedNodes.push({
      ...rel,
      position: { x: posX - 55, y: posY },
      zIndex: 10,
    });
  });

  // Handle any remaining unattached nodes
  nodes.forEach((n) => {
    if (!placedNodes.some((p) => p.id === n.id)) {
      placedNodes.push({
        ...n,
        position: { x: 100, y: baseY + 300 },
        zIndex: 10,
      });
    }
  });

  // 3. Laser-straight direct connections with proper ports
  const nodeMap = new Map<string, Node>();
  placedNodes.forEach((n) => nodeMap.set(n.id, n));

  const styledEdges = allEdges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    let sourceHandle: string | undefined;
    let targetHandle: string | undefined;

    if (sourceNode && targetNode) {
      const isSrcAttr = sourceNode.type?.includes('attribute');
      const isTgtAttr = targetNode.type?.includes('attribute');

      if (isSrcAttr && !isTgtAttr) {
        if (sourceNode.position.y < targetNode.position.y) {
          sourceHandle = 'bottom';
          targetHandle = 'top';
        } else {
          sourceHandle = 'top';
          targetHandle = 'bottom';
        }
      } else if (!isSrcAttr && isTgtAttr) {
        if (targetNode.position.y < sourceNode.position.y) {
          sourceHandle = 'top';
          targetHandle = 'bottom';
        } else {
          sourceHandle = 'bottom';
          targetHandle = 'top';
        }
      } else {
        // Entity <-> Relationship
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;

        // Predominantly vertical connection
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 60) {
          if (dy > 0) {
            sourceHandle = 'bottom';
            targetHandle = 'top';
          } else {
            sourceHandle = 'top';
            targetHandle = 'bottom';
          }
        } else {
          // Horizontal connection
          if (dx >= 0) {
            sourceHandle = 'right';
            targetHandle = 'left';
          } else {
            sourceHandle = 'left';
            targetHandle = 'right';
          }
        }
      }
    }

    return {
      ...edge,
      sourceHandle: sourceHandle || 'right',
      targetHandle: targetHandle || 'left',
      type: 'straight',
      data: {
        ...edge.data,
        isStraight: true,
      },
      animated: false,
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
