import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Wand2,
  Loader2,
  ArrowRight,
  Lightbulb,
  KeyRound,
  Cloud,
  Database,
  GitBranch,
} from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { getLayoutedElements } from '@/utils/autoLayout';
import { AIClientConfig, PROVIDER_DEFAULTS } from '@/utils/aiClient';
import { DiagramType } from '@/schemas/diagram.schema';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiagram: (nodes: Node[], edges: Edge[], title: string, summary: string) => void;
  onOpenSettings: () => void;
  aiConfig?: AIClientConfig;
}

const VALID_NODE_TYPES = new Set([
  'custom',
  'container',
  'note',
  'server',
  'cloud',
  'microservice',
  'function',
  'api',
  'database',
  'cache',
  'storage',
  'queue',
  'router',
  'loadbalancer',
  'firewall',
  'auth',
  'flow_process',
  'flow_decision',
  'flow_terminal',
  'erd_entity',
  'erd_weak_entity',
  'erd_relationship',
  'erd_weak_relationship',
  'erd_attribute',
  'erd_key_attribute',
  'erd_multivalued_attribute',
  'erd_derived_attribute',
]);

const TYPE_MAP: Record<string, { type: string; defaultIcon?: string }> = {
  compute: { type: 'server' },
  api_gateway: { type: 'router' },
  serverless: { type: 'function' },
  k8s: { type: 'custom', defaultIcon: 'Layers' },
  client: { type: 'custom', defaultIcon: 'Globe' },
  web: { type: 'custom', defaultIcon: 'Globe' },
  mobile: { type: 'custom', defaultIcon: 'Smartphone' },
  iot: { type: 'custom', defaultIcon: 'Radio' },
  payment: { type: 'custom', defaultIcon: 'CreditCard' },
  stripe: { type: 'custom', defaultIcon: 'CreditCard' },
  dns: { type: 'custom', defaultIcon: 'Globe' },
  cdn: { type: 'custom', defaultIcon: 'Cloud' },
  notification: { type: 'custom', defaultIcon: 'Bell' },
  analytics: { type: 'custom', defaultIcon: 'Activity' },
  monitoring: { type: 'custom', defaultIcon: 'Activity' },
  nosql: { type: 'database' },
  event_bus: { type: 'queue' },
  decision: { type: 'flow_decision' },
  process: { type: 'flow_process' },
  terminal: { type: 'flow_terminal' },
  entity: { type: 'erd_entity' },
  weak_entity: { type: 'erd_weak_entity' },
  relationship: { type: 'erd_relationship' },
  weak_relationship: { type: 'erd_weak_relationship' },
  attribute: { type: 'erd_attribute' },
  key_attribute: { type: 'erd_key_attribute' },
  multivalued_attribute: { type: 'erd_multivalued_attribute' },
  derived_attribute: { type: 'erd_derived_attribute' },
};

function normalizeNodeType(rawType: string, label: string, providedIcon?: string): { type: string; iconName?: string } {
  const cleanType = (rawType || '').toLowerCase().trim();

  if (VALID_NODE_TYPES.has(cleanType)) {
    return {
      type: cleanType,
      iconName: cleanType === 'custom' ? providedIcon || 'Box' : undefined,
    };
  }

  // Check alias map
  if (TYPE_MAP[cleanType]) {
    const mapped = TYPE_MAP[cleanType];
    return {
      type: mapped.type,
      iconName: mapped.type === 'custom' ? providedIcon || mapped.defaultIcon || 'Box' : undefined,
    };
  }

  // Infer Lucide icon from label keywords if falling back to custom
  const lbl = (label || '').toLowerCase();
  let fallbackIcon = providedIcon || 'Box';
  if (lbl.includes('pay') || lbl.includes('stripe') || lbl.includes('checkout') || lbl.includes('billing')) fallbackIcon = 'CreditCard';
  else if (lbl.includes('mobile') || lbl.includes('app') || lbl.includes('ios') || lbl.includes('android')) fallbackIcon = 'Smartphone';
  else if (lbl.includes('web') || lbl.includes('client') || lbl.includes('browser') || lbl.includes('ui')) fallbackIcon = 'Globe';
  else if (lbl.includes('log') || lbl.includes('monitor') || lbl.includes('metric') || lbl.includes('datadog') || lbl.includes('grafana')) fallbackIcon = 'Activity';
  else if (lbl.includes('notify') || lbl.includes('alert') || lbl.includes('email') || lbl.includes('sms')) fallbackIcon = 'Bell';
  else if (lbl.includes('search') || lbl.includes('elastic') || lbl.includes('index')) fallbackIcon = 'Search';
  else if (lbl.includes('cluster') || lbl.includes('k8s') || lbl.includes('docker') || lbl.includes('container')) fallbackIcon = 'Layers';
  else if (lbl.includes('stream') || lbl.includes('kafka') || lbl.includes('event')) fallbackIcon = 'Workflow';

  return {
    type: 'custom',
    iconName: fallbackIcon,
  };
}

const PRESETS_BY_TYPE: Record<DiagramType, Array<{ title: string; desc: string; prompt: string }>> = {
  system_design: [
    {
      title: 'AWS E-Commerce Platform',
      desc: 'CloudFront, API Gateway, Auth, Microservices, Redis, SQL DB, Queue, Stripe',
      prompt: 'A modern scalable AWS E-Commerce platform with CloudFront CDN, API Gateway, Auth IAM, Order and Product microservices, Redis cache, PostgreSQL DB, SQS Message Queue for order processing, and Stripe payments.',
    },
    {
      title: 'Real-Time Event Streaming',
      desc: 'IoT Ingest, Kafka Event Bus, Workers, Storage, Redis, Web Dashboard',
      prompt: 'A high-throughput real-time event streaming pipeline with IoT devices, Kafka Event Bus, serverless function workers, S3 object storage, Redis cache, and live Web Client dashboard.',
    },
    {
      title: 'Enterprise Serverless Stack',
      desc: 'Web App, API Gateway, Lambda Functions, SQL Database, S3 Storage, Auth',
      prompt: 'A full-stack serverless architecture with Web Client, Router API Gateway, Serverless Lambda Functions, PostgreSQL Database, Object Storage bucket, and Auth provider.',
    },
    {
      title: 'Microservices Backend',
      desc: 'Load Balancer, Auth Service, User Microservice, Payment Service, Queue, Database',
      prompt: 'A microservices cluster with Load Balancer, Auth service, User and Order microservices, Message Queue broker, SQL Database, and Stripe payment processor.',
    },
  ],
  erd: [
    {
      title: 'Banking: Customer & Loan ERD',
      desc: 'Customer strong entity with (C_id PK, C_name) borrows Loan weak entity with (L-name, L-date)',
      prompt: 'Peter Chen ER Diagram for Banking: Customer strong entity with attributes C_id (primary key) and C_name, connected via Borrows relationship to Loan weak entity with attributes L-name and L-date.',
    },
    {
      title: 'University Course Enrollment',
      desc: 'Student (s_id PK, name) enrolls in Course (c_code PK, title) taught by Instructor',
      prompt: 'Peter Chen ER Diagram for a University: Student entity with s_id (PK) and name, Enrolls_In relationship (M:N) with Course entity with c_code (PK) and title, connected via Teaches relationship (1:N) to Instructor entity.',
    },
    {
      title: 'E-Commerce Orders & Items',
      desc: 'User (user_id PK) places Order (order_id PK) containing OrderItem weak entity and Product',
      prompt: 'Peter Chen ER Diagram for E-Commerce: User entity (user_id PK, email) places Orders (order_id PK, order_date). Order has weak entity OrderItem (item_id PK, quantity) which references Product entity (prod_id PK, price).',
    },
    {
      title: 'Hospital & Patient Care',
      desc: 'Doctor (doc_id PK) examines Patient (pat_id PK) with MedicalRecord weak entity',
      prompt: 'Peter Chen ER Diagram for Hospital: Doctor entity (doc_id PK, specialty) examines Patient entity (pat_id PK, name, phone_numbers multivalued), linked to MedicalRecord weak entity (record_no PK, diagnosis, date).',
    },
  ],
  flowchart: [
    {
      title: 'User Authentication Flow',
      desc: 'Start -> Enter credentials -> Validate Decision -> Success / Error -> End',
      prompt: 'Flowchart for user login: Start -> Enter username and password -> Is password valid? -> If yes: Issue JWT token -> Redirect to dashboard -> End. If no: Show error -> Increment failure count -> End.',
    },
    {
      title: 'Order Refund Processing',
      desc: 'Start -> Receive request -> Check policy -> Process refund -> Notify -> End',
      prompt: 'Flowchart for customer refund: Start -> Receive refund request -> Is order within 30 days? -> If yes: Approve refund -> Execute Stripe refund -> Send email -> End. If no: Reject -> Send rejection note -> End.',
    },
  ],
};

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  isOpen,
  onClose,
  onApplyDiagram,
  onOpenSettings,
  aiConfig,
}) => {
  const [diagramType, setDiagramType] = useState<DiagramType>('system_design');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepText, setStepText] = useState('Generating diagram...');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeProvider = aiConfig?.provider || 'groq';
  const activeProviderName = PROVIDER_DEFAULTS[activeProvider]?.name || 'Groq';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!loading) return;
    const steps =
      diagramType === 'erd'
        ? [
            'Analyzing entity relationships & cardinality...',
            'Constructing Peter Chen ERD entities, diamonds & attributes...',
            'Binding primary key & multivalued attributes...',
            'Applying orthogonal ER layout...',
          ]
        : [
            'Analyzing system requirements...',
            'Matching components to registered architecture types...',
            'Structuring tiered VPC subnets & data paths...',
            'Applying topological layer layout...',
          ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setStepText(steps[i]);
    }, 1100);
    return () => clearInterval(interval);
  }, [loading, diagramType]);

  const handleGenerate = async (targetPrompt?: string, targetType?: DiagramType) => {
    const textToUse = targetPrompt || prompt;
    const typeToUse = targetType || diagramType;
    if (!textToUse.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse.trim(),
          diagramType: typeToUse,
          aiConfig: aiConfig || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      const rawNodes: Node[] = (data.nodes || []).map((n: any) => {
        const normalized = normalizeNodeType(n.type, n.label, n.iconName);
        return {
          id: n.id,
          type: normalized.type,
          position: { x: 0, y: 0 },
          data: {
            label: n.label,
            sublabel: n.sublabel,
            color: n.color || (typeToUse === 'erd' ? 'emerald' : 'indigo'),
            iconName: normalized.iconName,
            tier: typeof n.tier === 'number' ? n.tier : undefined,
            group: n.group,
          },
        };
      });

      // High-signal keywords permitted as labels
      const ALLOWED_LABEL_PATTERNS = /^(grpc|websocket|ws|pub\/sub|pubsub|webhook|cdc|sse|event|kafka|stream|1|m|n|0\.\.1|1\.\.1|1\.\.n|m\.\.n)$/i;
      let labeledCount = 0;
      const MAX_LABELED_EDGES = Math.max(2, Math.floor((data.edges || []).length * 0.35));

      const rawEdges: Edge[] = (data.edges || []).map((e: any) => {
        let label = (e.label || '').trim();

        // Discard redundant or filler labels for architecture, but allow 1/M/N for ERD
        const isHighSignal = ALLOWED_LABEL_PATTERNS.test(label);
        if (typeToUse === 'system_design' && (!isHighSignal || labeledCount >= MAX_LABELED_EDGES)) {
          label = '';
        } else if (label) {
          labeledCount++;
        }

        return {
          id: e.id || `e_${e.source}_${e.target}`,
          source: e.source,
          target: e.target,
          label: label || undefined,
          type: 'smoothstep',
          animated: e.animated ?? (typeToUse === 'system_design'),
        };
      });

      // Apply Specialized Auto-Layout
      const layouted = getLayoutedElements(rawNodes, rawEdges, { direction: 'LR' });

      onApplyDiagram(layouted.nodes, layouted.edges, data.name || 'Generated Diagram', data.summary || '');
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const currentPresets = PRESETS_BY_TYPE[diagramType] || PRESETS_BY_TYPE.system_design;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Wand2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Generate with AI
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {activeProviderName}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Select your diagram type and describe requirements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="API Key Settings"
            >
              <KeyRound size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Diagram Type Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Diagram Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDiagramType('system_design')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  diagramType === 'system_design'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Cloud size={16} className={diagramType === 'system_design' ? 'text-indigo-600' : 'text-zinc-400'} />
                <div>
                  <div className="text-xs font-bold leading-tight">System Design</div>
                  <div className="text-[10px] text-zinc-400">Cloud, VPC, Microservices</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDiagramType('erd')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  diagramType === 'erd'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Database size={16} className={diagramType === 'erd' ? 'text-emerald-600' : 'text-zinc-400'} />
                <div>
                  <div className="text-xs font-bold leading-tight">ER Diagram</div>
                  <div className="text-[10px] text-zinc-400">Chen Notation (PK, Weak)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDiagramType('flowchart')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  diagramType === 'flowchart'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <GitBranch size={16} className={diagramType === 'flowchart' ? 'text-amber-600' : 'text-zinc-400'} />
                <div>
                  <div className="text-xs font-bold leading-tight">Flowchart</div>
                  <div className="text-[10px] text-zinc-400">Logic & Process Flow</div>
                </div>
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={loading}
                placeholder={
                  diagramType === 'erd'
                    ? 'e.g. Design a Banking ER model with Customer (C_id PK, C_name) borrowing Loan (L-name, L-date)...'
                    : diagramType === 'flowchart'
                    ? 'e.g. Design a user refund approval flowchart with validation checks...'
                    : 'e.g. Build an AWS e-commerce platform with CloudFront, API Gateway, microservices, and PostgreSQL...'
                }
                className="w-full h-24 p-3.5 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 transition-all resize-none disabled:opacity-50"
              />
              <div className="absolute right-3 bottom-3 text-[11px] text-zinc-400 select-none hidden sm:block">
                Press <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">Ctrl+Enter</kbd>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                {error.includes('API key') && (
                  <button
                    onClick={onOpenSettings}
                    className="underline font-semibold ml-2 text-rose-700 dark:text-rose-300"
                  >
                    Configure Key
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Preset Ideas */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <Lightbulb size={14} className="text-amber-500" />
              <span>Reference presets for {diagramType === 'erd' ? 'ER Diagrams' : diagramType === 'flowchart' ? 'Flowcharts' : 'Architecture'}:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentPresets.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    handleGenerate(preset.prompt, diagramType);
                  }}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left transition-all group disabled:opacity-50 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                      {preset.title}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
                      {preset.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
          <span className="text-xs text-zinc-400">
            {loading ? (
              <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 size={14} className="animate-spin" />
                {stepText}
              </span>
            ) : (
              'Generates standard shapes, attributes, and routed connections'
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate Diagram</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
