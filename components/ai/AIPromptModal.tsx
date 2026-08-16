import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Loader2,
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
  diagramType?: DiagramType;
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

  if (TYPE_MAP[cleanType]) {
    const mapped = TYPE_MAP[cleanType];
    return {
      type: mapped.type,
      iconName: mapped.type === 'custom' ? providedIcon || mapped.defaultIcon || 'Box' : undefined,
    };
  }

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

const PRESET_PILLS: Record<DiagramType, Array<{ label: string; prompt: string }>> = {
  system_design: [
    {
      label: '🛒 AWS E-Commerce',
      prompt: 'A modern scalable AWS E-Commerce platform with CloudFront CDN, API Gateway, Auth, Order and Product microservices, Redis cache, PostgreSQL DB, SQS Queue, and Stripe payments.',
    },
    {
      label: '⚡ Real-Time Streaming',
      prompt: 'A high-throughput real-time event streaming pipeline with IoT devices, Kafka Event Bus, serverless workers, S3 object storage, Redis cache, and live Web Client dashboard.',
    },
    {
      label: '🚀 Serverless App',
      prompt: 'A full-stack serverless architecture with Web Client, Router API Gateway, Serverless Lambda Functions, PostgreSQL Database, Object Storage bucket, and Auth provider.',
    },
  ],
  erd: [
    {
      label: '🏦 Banking & Loans',
      prompt: 'Peter Chen ER Diagram for Banking: Customer entity (C_id PK, Name, Email) connected via Places relationship to Loan entity (Loan_ID PK, Amount, Date).',
    },
    {
      label: '🎓 University Enrollment',
      prompt: 'Peter Chen ER Diagram for University: Student entity with s_id (PK) and name, Enrolls_In relationship (M:N) with Course entity with c_code (PK) and title, connected via Teaches relationship (1:N) to Instructor entity.',
    },
    {
      label: '📦 Orders & Products',
      prompt: 'Peter Chen ER Diagram: Customer places Orders (1:N), Order contains Products (M:N), and Supplier supplies Products (1:N) with PK attributes.',
    },
  ],
  flowchart: [
    {
      label: '🔐 User Login & JWT',
      prompt: 'Flowchart for user login: Start -> Enter username and password -> Is password valid? -> If yes: Issue JWT token -> Redirect to dashboard -> End. If no: Show error -> Increment failure count -> End.',
    },
    {
      label: '💳 Refund Processing',
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
  diagramType = 'system_design',
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeModel = aiConfig?.model || 'llama-3.1-8b-instant';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const handleGenerate = async (targetPrompt?: string) => {
    const textToUse = targetPrompt || prompt;
    if (!textToUse.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse.trim(),
          diagramType: diagramType,
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
            color: n.color || 'indigo',
            iconName: normalized.iconName,
            tier: typeof n.tier === 'number' ? n.tier : undefined,
            group: n.group,
          },
        };
      });

      const rawEdges: Edge[] = (data.edges || []).map((e: any) => {
        return {
          id: e.id || `e_${e.source}_${e.target}`,
          source: e.source,
          target: e.target,
          label: (e.label || '').trim() || undefined,
          type: diagramType === 'erd' ? 'straight' : 'smoothstep',
          animated: e.animated ?? (diagramType === 'system_design'),
          data: {
            isStraight: diagramType === 'erd',
          },
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

  const currentPills = PRESET_PILLS[diagramType] || PRESET_PILLS.system_design;

  const domainLabels: Record<DiagramType, { label: string; icon: React.ReactNode; color: string }> = {
    system_design: {
      label: 'System Design',
      icon: <Cloud size={13} />,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
    erd: {
      label: 'ER Diagram',
      icon: <Database size={13} />,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    flowchart: {
      label: 'Flowchart',
      icon: <GitBranch size={13} />,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    },
  };

  const domain = domainLabels[diagramType] || domainLabels.system_design;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Generate with AI
            </h3>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold border ${domain.color}`}>
              {domain.icon}
              {domain.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {activeModel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Configure API key / model"
            >
              <KeyRound size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5">

          {/* Prompt Input */}
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
                  ? 'Describe entities, relationships, and attributes (e.g. Customers place Orders, Orders contain Products)...'
                  : diagramType === 'flowchart'
                  ? 'Describe workflow steps and decision branches (e.g. User login authentication flow)...'
                  : 'Describe your cloud architecture (e.g. AWS microservices with API Gateway, Redis, PostgreSQL, and Stripe)...'
              }
              className="w-full h-24 p-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 transition-all resize-none disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="p-2.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center justify-between">
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

          {/* Quick Idea Pills */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-zinc-400">Quick suggestions:</div>
            <div className="flex flex-wrap gap-1.5">
              {currentPills.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setPrompt(pill.prompt);
                    handleGenerate(pill.prompt);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
          <span className="text-[11px] text-zinc-400">
            {loading ? (
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 size={13} className="animate-spin" />
                Generating diagram...
              </span>
            ) : (
              <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[10px]">Ctrl+Enter</kbd> to run</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Generate</span>
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

export default AIPromptModal;
