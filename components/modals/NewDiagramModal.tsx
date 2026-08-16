import React from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  Database,
  GitBranch,
  Wand2,
  Plus,
  ArrowRight,
  X,
  Sparkles,
  Layers,
  Square,
  KeyRound,
  Server,
  Workflow,
} from 'lucide-react';
import { DiagramType } from '@/schemas/diagram.schema';

interface NewDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: DiagramType, startWithAI?: boolean) => void;
  canDismiss?: boolean;
}

interface TypeOption {
  type: DiagramType;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  borderColor: string;
  bgHover: string;
  symbols: string[];
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'system_design',
    title: 'Cloud & System Architecture',
    badge: 'Microservices & VPC',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    desc: 'Distributed systems, multi-tier VPC subnets, AWS/GCP services, microservices, caches, and queues.',
    icon: Cloud,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'hover:border-indigo-500 group-hover:border-indigo-500',
    bgHover: 'group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-950/20',
    symbols: ['Microservices', '3D Databases', 'API Gateways', 'Redis Cache', 'VPC Subnets', 'SQS Queues'],
  },
  {
    type: 'erd',
    title: 'Entity-Relationship (ERD)',
    badge: "Peter Chen's Notation",
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    desc: 'Formal database conceptual modeling using official Chen notation for strong/weak entities, diamonds, and key attributes.',
    icon: Database,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'hover:border-emerald-500 group-hover:border-emerald-500',
    bgHover: 'group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/20',
    symbols: ['Strong Entities', 'Weak Entities', 'Relationships (Diamonds)', 'Key Attributes (PK)', 'Multivalued'],
  },
  {
    type: 'flowchart',
    title: 'Flowchart & Business Process',
    badge: 'Logic & Workflows',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    desc: 'Algorithm flowcharts, decision branching logic, approval steps, and user process journeys.',
    icon: GitBranch,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'hover:border-amber-500 group-hover:border-amber-500',
    bgHover: 'group-hover:bg-amber-50/50 dark:group-hover:bg-amber-950/20',
    symbols: ['Process Steps', 'Decision Diamonds', 'Start / End Terminals', 'Notes & Subflows'],
  },
];

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  canDismiss = true,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={canDismiss ? onClose : undefined}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DiaFlow
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                New Workspace
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              Select Diagram Type
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The canvas and symbol palette will customize strictly for your chosen modeling domain.
            </p>
          </div>

          {canDismiss && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Body: Grid of Diagram Types */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;

              return (
                <div
                  key={opt.type}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Top Icon & Badge */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm ${opt.accentColor}`}
                      >
                        <Icon size={24} />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {opt.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    {/* Symbol Preview Tags */}
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Includes:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {opt.symbols.map((sym) => (
                          <span
                            key={sym}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Blank Canvas or With AI */}
                  <div className="pt-5 mt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectType(opt.type, true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Generate with AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectType(opt.type, false)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Start Blank</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewDiagramModal;
