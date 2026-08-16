import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  LayoutGrid, 
  Loader2, 
  Lightbulb, 
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { getLayoutedElements } from '@/utils/autoLayout';
import { AIClientConfig, PROVIDER_DEFAULTS } from '@/utils/aiClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  title: string;
  onUpdateDiagram: (nodes: Node[], edges: Edge[]) => void;
  onOpenSettings: () => void;
  aiConfig?: AIClientConfig;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  title,
  onUpdateDiagram,
  onOpenSettings,
  aiConfig,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am your **DiaFlow AI Architecture Copilot**.\n\nI can analyze your diagram, audit for security & single points of failure (SPOF), suggest cloud components, or explain your system architecture.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string, mode?: 'audit' | 'explain') => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          contextDiagram: {
            name: title,
            nodes,
            edges,
          },
          aiConfig: aiConfig || undefined,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response from assistant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error**: ${(err as Error).message}\n\nPlease verify your API key in settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLayout = (direction: 'LR' | 'TB') => {
    if (nodes.length === 0) return;
    const layouted = getLayoutedElements(nodes, edges, { direction });
    onUpdateDiagram(layouted.nodes, layouted.edges);

    setMessages((prev) => [
      ...prev,
      {
        id: `layout_${Date.now()}`,
        role: 'assistant',
        content: `📐 **Auto-Layout Applied**: Re-organized **${nodes.length} nodes** and **${edges.length} connections** into clean tiered layers (${direction === 'LR' ? 'Left-to-Right' : 'Top-to-Bottom'}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedMarkdown = (text: string) => {
    // Clean, lightweight markdown renderer for headers, bullet points, bold, and code snippets
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-3 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm mt-2">
                {line.replace('# ', '')}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const itemText = line.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-500 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+\./)?.[0];
            const itemText = line.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-indigo-500 font-semibold">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-zinc-100">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">$1</code>');
  };

  if (!isOpen) return null;

  return (
    <aside className="w-96 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-30 shadow-2xl transition-all duration-200 h-full min-h-0 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Bot size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Architecture Copilot
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                AI
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {nodes.length} nodes, {edges.length} connections
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            title="Configure API Key"
          >
            <KeyRound size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
        <button
          onClick={() => handleSendMessage('Perform an Architecture Security & SPOF Audit', 'audit')}
          disabled={loading || nodes.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50"
        >
          <ShieldAlert size={12} className="text-amber-500" />
          <span>Security Audit</span>
        </button>

        <button
          onClick={() => handleSendMessage('Explain the architecture and request flow', 'explain')}
          disabled={loading || nodes.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50"
        >
          <FileText size={12} className="text-blue-500" />
          <span>Explain Flow</span>
        </button>

        <button
          onClick={() => handleAutoLayout('LR')}
          disabled={loading || nodes.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50"
        >
          <LayoutGrid size={12} className="text-emerald-500" />
          <span>Auto-Layout</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-xs'
              }`}
            >
              {msg.role === 'assistant' ? (
                renderFormattedMarkdown(msg.content)
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            <span className="text-[9px] text-zinc-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 w-fit">
            <Loader2 size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Analyzing architecture...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about this diagram or request changes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
};
