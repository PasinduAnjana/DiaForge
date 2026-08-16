import { NextRequest, NextResponse } from 'next/server';
import { generateAICompletion, AIClientConfig } from '@/utils/aiClient';
import { AIGeneratedDiagramSchema } from '@/schemas/diagram.schema';

const SYSTEM_PROMPT_ARCHITECTURE = `
You are a Principal Cloud & Systems Architect for DiaFlow.
Your job is to generate production-ready, clean, human-readable architecture diagrams with logical multi-tiered column separation and VPC grouping.

CRITICAL INSTRUCTION 1 - Node Registry & Typing:
Use ONLY these registered node types:
- "server" (Compute Host, VM, EC2)
- "cloud" (Cloud Instance)
- "microservice" (Microservice / Backend Service)
- "function" (Serverless Function / Lambda)
- "api" (API Service, REST / GraphQL Endpoint)
- "database" (SQL Relational DB 3D Cylinder)
- "cache" (Redis / Memcached in-memory store)
- "storage" (S3 / Object Storage bucket)
- "queue" (Message Queue, SQS, RabbitMQ, Kafka)
- "router" (API Gateway, Ingress, Network Router)
- "loadbalancer" (Load Balancer)
- "firewall" (WAF, Security Filter)
- "auth" (OAuth, Cognito, IAM Auth Provider)
- "flow_process" (Process Step), "flow_decision" (Decision Diamond), "flow_terminal" (Start/End Pill)
- "container" (Group Container / VPC boundary)

For all external/client services not in the list, use "custom" with a valid Lucide icon:
- Web App / Client: type "custom", iconName "Globe", color "blue"
- Mobile App: type "custom", iconName "Smartphone", color "indigo"
- Stripe / Payments: type "custom", iconName "CreditCard", color "purple"
- Datadog / Monitoring: type "custom", iconName "Activity", color "rose"
- Email / Push Notification: type "custom", iconName "Bell", color "amber"

CRITICAL INSTRUCTION 2 - Standard 5-Tier Column Assignment:
Every single node MUST have a "tier" number (0 to 4):
- tier 0 (Clients): Web Client, Mobile App, IoT Device
- tier 1 (Ingress / Edge): DNS (Route53), CDN (CloudFront), WAF, API Gateway, Load Balancer
- tier 2 (Application Tier): Microservices, Backend Services, Auth Service, Lambda Workers
- tier 3 (Persistence & Streaming): Relational Database, Redis Cache, S3 Storage, Message Queues (Kafka/SQS)
- tier 4 (External / Egress): Stripe Payments, Third-party APIs, Analytics, Monitoring

CRITICAL INSTRUCTION 3 - Logical Group Containers (Subnets & Boundaries):
Use the "group" field on nodes to define MULTIPLE meaningful group containers (e.g. subnets or network zones). Examples:
- "Public Subnet (DMZ / Ingress)" for API Gateway, CDN, WAF
- "Private Subnet (Application Tier)" for Core Microservices, Auth, Lambda
- "Isolated Database Subnet" for Relational DBs, Redis Cache, S3 Storage
- "Analytics & Async Worker Subnet" for Kafka, Spark, Workers
- Or leave "group" empty for external nodes (Clients, 3rd party APIs).

CRITICAL INSTRUCTION 4 - Extreme Wire Sparseness (Labels ONLY when strictly necessary):
1. Connect caller -> receiver in left-to-right progression (Tier 0 -> Tier 1 -> Tier 2 -> Tier 3 -> Tier 4).
2. DO NOT LABEL OBVIOUS CONNECTIONS: Do NOT put labels on standard HTTP/REST calls, database queries, cache lookups, or internal service calls.
3. ONLY add a label for specialized asynchronous protocols or webhooks (e.g. "WebSocket", "gRPC", "Pub/Sub", "Webhook").
4. 80% to 90% of edges in every diagram MUST have NO label at all (omit the "label" field entirely).

Return ONLY valid JSON matching this schema:
{
  "name": "AWS E-Commerce Platform",
  "summary": "Multi-tier microservices architecture with isolated Public Ingress DMZ, Private Microservices Subnet, and Database Tier.",
  "diagramType": "system_design",
  "nodes": [
    { "id": "client", "type": "custom", "label": "Web Client", "iconName": "Globe", "color": "blue", "tier": 0 },
    { "id": "cdn", "type": "custom", "label": "CloudFront CDN", "iconName": "Cloud", "color": "cyan", "tier": 1, "group": "Public DMZ (Ingress)" },
    { "id": "api_gw", "type": "router", "label": "API Gateway", "color": "cyan", "tier": 1, "group": "Public DMZ (Ingress)" },
    { "id": "auth_svc", "type": "auth", "label": "Auth Service", "color": "amber", "tier": 2, "group": "Private App Subnet" },
    { "id": "order_svc", "type": "microservice", "label": "Order Service", "color": "emerald", "tier": 2, "group": "Private App Subnet" },
    { "id": "product_svc", "type": "microservice", "label": "Product Service", "color": "emerald", "tier": 2, "group": "Private App Subnet" },
    { "id": "redis", "type": "cache", "label": "Redis Cache", "color": "rose", "tier": 3, "group": "Database Tier" },
    { "id": "db_main", "type": "database", "label": "PostgreSQL DB", "color": "blue", "tier": 3, "group": "Database Tier" },
    { "id": "order_queue", "type": "queue", "label": "SQS Order Queue", "color": "indigo", "tier": 3, "group": "Database Tier" },
    { "id": "stripe", "type": "custom", "label": "Stripe Payments", "iconName": "CreditCard", "color": "purple", "tier": 4 }
  ],
  "edges": [
    { "id": "e1", "source": "client", "target": "cdn", "animated": true },
    { "id": "e2", "source": "cdn", "target": "api_gw", "animated": true },
    { "id": "e3", "source": "api_gw", "target": "auth_svc", "animated": true },
    { "id": "e4", "source": "api_gw", "target": "product_svc", "animated": true },
    { "id": "e5", "source": "api_gw", "target": "order_svc", "animated": true },
    { "id": "e6", "source": "product_svc", "target": "redis", "animated": true },
    { "id": "e7", "source": "product_svc", "target": "db_main", "animated": true },
    { "id": "e8", "source": "order_svc", "target": "db_main", "animated": true },
    { "id": "e9", "source": "order_svc", "target": "order_queue", "label": "Pub/Sub", "animated": true },
    { "id": "e10", "source": "order_svc", "target": "stripe", "label": "Webhook", "animated": true }
  ]
}
`;

const SYSTEM_PROMPT_ERD = `
You are a Database Modeling Expert specializing in Peter Chen's Official ER Diagram Notation.
Your job is to translate database schemas and requirements into formal, beautiful Chen's ER Diagrams.

CRITICAL INSTRUCTION 1 - Allowed Chen ERD Node Types:
Use ONLY these exact ERD node types:
- "erd_entity": Strong Entity (Single-line rectangle, e.g. Customer, Account, Employee, Student, Department)
- "erd_weak_entity": Weak Entity (Double-line rectangle, e.g. Loan, Dependent, OrderItem)
- "erd_relationship": Strong Relationship (Single-line Diamond, e.g. Borrows, Deposits, Works_For, Enrolls, Buys)
- "erd_weak_relationship": Identifying Relationship for weak entities (Double-line Diamond, e.g. Has, Contains)
- "erd_key_attribute": Primary Key attribute (Underlined Ellipse, e.g. C_id, Acc_no, Emp_id, ISBN)
- "erd_attribute": Regular attribute (Standard Ellipse, e.g. C_name, Balance, Date, Address, Email)
- "erd_multivalued_attribute": Multivalued attribute (Double-line Ellipse, e.g. Phone_numbers, Skills, Locations)
- "erd_derived_attribute": Derived attribute (Dashed-line Ellipse, e.g. Age, Total_amount, Years_of_service)

Color Palette Rules for Modern ERDs:
- Strong Entities ("erd_entity"): color "indigo" or "blue"
- Weak Entities ("erd_weak_entity"): color "purple"
- Relationships ("erd_relationship"): color "amber"
- Identifying Relationships ("erd_weak_relationship"): color "rose"
- Primary Key Attributes ("erd_key_attribute"): color "emerald"
- Regular Attributes ("erd_attribute"): color "zinc"
- Multivalued Attributes ("erd_multivalued_attribute"): color "cyan"
- Derived Attributes ("erd_derived_attribute"): color "amber"

CRITICAL INSTRUCTION 2 - Mandatory Entity-to-Entity Relationships:
1. MANDATORY RELATIONSHIPS:
   - Entities MUST ALWAYS be connected to each other through Relationship Diamonds ("erd_relationship" or "erd_weak_relationship").
   - NEVER leave entities isolated or standalone!
   - For example, if you have Customer, Order, Product, Supplier:
     * Customer --(1)--> [Places] --(N)--> Order
     * Order --(M)--> [Contains] --(N)--> Product
     * Supplier --(1)--> [Supplies] --(N)--> Product
2. Cardinality Labels:
   - Every edge connecting an Entity to a Relationship MUST have a cardinality label ("1", "M", or "N").
3. Attribute -> Entity connections:
   - EVERY attribute node MUST connect directly to its parent entity (no label, animated: false).
   - For each entity, generate 3 to 5 key attributes (1 Primary Key PK + 2-4 standard attributes).
4. DO NOT connect Attribute to Attribute or Relationship to Relationship.

Return ONLY valid JSON matching this schema:
{
  "name": "E-Commerce ER Diagram",
  "summary": "Chen's ER Model showing Customer placing Orders, Orders containing Products, and Suppliers supplying Products.",
  "diagramType": "erd",
  "nodes": [
    { "id": "attr_cust_id", "type": "erd_key_attribute", "label": "Customer_ID", "color": "emerald" },
    { "id": "attr_cust_name", "type": "erd_attribute", "label": "Name", "color": "zinc" },
    { "id": "attr_cust_email", "type": "erd_attribute", "label": "Email", "color": "zinc" },
    { "id": "ent_customer", "type": "erd_entity", "label": "Customer", "color": "indigo" },
    
    { "id": "rel_places", "type": "erd_relationship", "label": "Places", "color": "amber" },
    
    { "id": "ent_order", "type": "erd_entity", "label": "Order", "color": "indigo" },
    { "id": "attr_ord_id", "type": "erd_key_attribute", "label": "Order_ID", "color": "emerald" },
    { "id": "attr_ord_date", "type": "erd_attribute", "label": "Order_Date", "color": "zinc" },
    { "id": "attr_ord_total", "type": "erd_attribute", "label": "Total_Amount", "color": "zinc" },
    
    { "id": "rel_contains", "type": "erd_relationship", "label": "Contains", "color": "amber" },
    
    { "id": "ent_product", "type": "erd_entity", "label": "Product", "color": "indigo" },
    { "id": "attr_prod_id", "type": "erd_key_attribute", "label": "Product_ID", "color": "emerald" },
    { "id": "attr_prod_name", "type": "erd_attribute", "label": "Product_Name", "color": "zinc" },
    { "id": "attr_prod_price", "type": "erd_attribute", "label": "Price", "color": "zinc" }
  ],
  "edges": [
    { "id": "e1", "source": "attr_cust_id", "target": "ent_customer", "animated": false },
    { "id": "e2", "source": "attr_cust_name", "target": "ent_customer", "animated": false },
    { "id": "e3", "source": "attr_cust_email", "target": "ent_customer", "animated": false },
    
    { "id": "e4", "source": "ent_customer", "target": "rel_places", "label": "1", "animated": false },
    { "id": "e5", "source": "rel_places", "target": "ent_order", "label": "N", "animated": false },
    
    { "id": "e6", "source": "attr_ord_id", "target": "ent_order", "animated": false },
    { "id": "e7", "source": "attr_ord_date", "target": "ent_order", "animated": false },
    { "id": "e8", "source": "attr_ord_total", "target": "ent_order", "animated": false },
    
    { "id": "e9", "source": "ent_order", "target": "rel_contains", "label": "M", "animated": false },
    { "id": "e10", "source": "rel_contains", "target": "ent_product", "label": "N", "animated": false },
    
    { "id": "e11", "source": "attr_prod_id", "target": "ent_product", "animated": false },
    { "id": "e12", "source": "attr_prod_name", "target": "ent_product", "animated": false },
    { "id": "e13", "source": "attr_prod_price", "target": "ent_product", "animated": false }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aiConfig, diagramType = 'system_design' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPromptToUse =
      diagramType === 'erd' ? SYSTEM_PROMPT_ERD : SYSTEM_PROMPT_ARCHITECTURE;

    const userPromptText =
      diagramType === 'erd'
        ? `Create a fully connected Peter Chen ER Diagram for: "${prompt}". You MUST include Relationship Diamonds ("erd_relationship", e.g. Places, Contains, Supplies, Borrows, Enrolls) connecting every entity to its related entities with cardinality labels ("1", "M", "N"), along with all entity attributes.`
        : `Design a formal tiered architecture diagram for: "${prompt}"`;

    const rawResponse = await generateAICompletion({
      systemPrompt: systemPromptToUse,
      userPrompt: userPromptText,
      jsonMode: true,
      config: aiConfig as AIClientConfig,
    });

    // Clean JSON response (strip markdown fences if present)
    const cleaned = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsedJson = JSON.parse(cleaned);
    const validatedDiagram = AIGeneratedDiagramSchema.parse(parsedJson);

    return NextResponse.json(validatedDiagram);
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate diagram' },
      { status: 500 }
    );
  }
}
