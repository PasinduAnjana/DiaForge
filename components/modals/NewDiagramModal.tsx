import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  Database,
  GitBranch,
  Plus,
  X,
  Sparkles,
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
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  iconBg: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'system_design',
    title: 'System Design',
    desc: 'Cloud services, microservices, databases & queues',
    icon: Cloud,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80',
  },
  {
    type: 'erd',
    title: 'ER Diagram',
    desc: "Peter Chen's entities, relationships & attributes",
    icon: Database,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80',
  },
  {
    type: 'flowchart',
    title: 'Flowchart',
    desc: 'Processes, decisions & sequential workflows',
    icon: GitBranch,
    accentColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80',
  },
];

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Choose Diagram Type
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select a workspace type to load the appropriate symbol palette.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Simple Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;

            return (
              <div
                key={opt.type}
                className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${opt.iconBg} ${opt.accentColor} mb-3`}
                  >
                    <Icon size={20} />
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectType(opt.type, true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>AI Generate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectType(opt.type, false)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Start Blank</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewDiagramModal;
