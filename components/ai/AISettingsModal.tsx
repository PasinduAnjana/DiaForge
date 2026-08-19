import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { AIProvider, PROVIDER_DEFAULTS, AIClientConfig } from '@/utils/aiClient';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIClientConfig;
  onSaveConfig: (config: AIClientConfig) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [provider, setProvider] = useState<AIProvider>(config?.provider || 'groq');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [customModel, setCustomModel] = useState(config?.model || '');
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; tag?: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch live active models for the provider and API key
  const fetchLiveModels = async (targetProvider: AIProvider, targetKey: string) => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiConfig: {
            provider: targetProvider,
            apiKey: targetKey,
          },
        }),
      });
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
      } else {
        setAvailableModels(PROVIDER_DEFAULTS[targetProvider]?.supportedModels || []);
      }
    } catch {
      setAvailableModels(PROVIDER_DEFAULTS[targetProvider]?.supportedModels || []);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const p = config?.provider || 'groq';
      const key = config?.apiKey || '';
      setProvider(p);
      setApiKey(key);
      setCustomModel(config?.model || PROVIDER_DEFAULTS[p]?.defaultModel || '');
      setSaved(false);
      fetchLiveModels(p, key);
    }
  }, [isOpen, config]);

  const activeProviderInfo = PROVIDER_DEFAULTS[provider];

  const handleProviderSelect = (p: AIProvider) => {
    setProvider(p);
    const defModel = PROVIDER_DEFAULTS[p].defaultModel;
    setCustomModel(defModel);
    fetchLiveModels(p, apiKey);
  };

  const handleApiKeyChange = (val: string) => {
    const trimmed = val.trim();
    setApiKey(trimmed);
    let targetP = provider;
    // Auto-detect provider if user pastes a key with known prefix
    if (trimmed.startsWith('gsk_') && provider !== 'groq') {
      targetP = 'groq';
      setProvider('groq');
      setCustomModel(PROVIDER_DEFAULTS.groq.defaultModel);
    } else if (trimmed.startsWith('sk-') && provider !== 'openai') {
      targetP = 'openai';
      setProvider('openai');
      setCustomModel(PROVIDER_DEFAULTS.openai.defaultModel);
    } else if (trimmed.startsWith('xai-') && provider !== 'grok') {
      targetP = 'grok';
      setProvider('grok');
      setCustomModel(PROVIDER_DEFAULTS.grok.defaultModel);
    }
    fetchLiveModels(targetP, trimmed);
  };

  const handleSave = () => {
    const finalProvider = provider;
    const finalKey = apiKey.trim();
    let finalModel = customModel.trim() || PROVIDER_DEFAULTS[finalProvider].defaultModel;

    // Safety check on model name
    if (finalProvider === 'openai' && (finalModel.startsWith('llama') || finalModel.startsWith('grok'))) {
      finalModel = PROVIDER_DEFAULTS.openai.defaultModel;
    } else if (finalProvider === 'groq' && (finalModel.startsWith('gpt') || finalModel.startsWith('grok'))) {
      finalModel = PROVIDER_DEFAULTS.groq.defaultModel;
    }

    onSaveConfig({
      provider: finalProvider,
      apiKey: finalKey,
      model: finalModel,
    });
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    onSaveConfig({
      provider,
      apiKey: '',
      model: PROVIDER_DEFAULTS[provider].defaultModel,
    });
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                AI Provider & API Configuration
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose your AI engine and API key
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Provider Selection Tabs */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Select AI Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_DEFAULTS) as AIProvider[]).map((p) => {
                const info = PROVIDER_DEFAULTS[p];
                const isSelected = provider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderSelect(p)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      {info.name}
                      {isSelected && <Check size={13} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                      {info.defaultModel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Model</span>
              <span className="text-[10px] text-zinc-400">
                {loadingModels ? 'Fetching live models...' : 'Select active model or type custom ID'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {(availableModels.length > 0 ? availableModels : activeProviderInfo.supportedModels || []).map((m) => {
                const isModelSelected = customModel === m.id || (!customModel && activeProviderInfo.defaultModel === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCustomModel(m.id)}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isModelSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="truncate">{m.name}</span>
                      {m.tag && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 font-normal ml-1 shrink-0">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
                      {m.id}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pt-1">
              <input
                type="text"
                placeholder="Or custom model ID (e.g. openai/gpt-oss-120b, gpt-4o)..."
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 font-mono transition-colors"
              />
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>{activeProviderInfo.name} API Key</span>
              <span className="text-[10px] font-normal text-zinc-400">
                or set <code className="font-mono">{activeProviderInfo.envKeyName}</code> in .env.local
              </span>
            </label>
            <input
              type="password"
              placeholder={`Enter ${activeProviderInfo.name} API key...`}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-indigo-500 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 font-mono transition-colors"
            />
          </div>

          {/* Links & Clear */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <a
              href={activeProviderInfo.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <span>Get your {activeProviderInfo.name} API key</span>
              <ExternalLink size={11} />
            </a>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-500 hover:underline cursor-pointer"
              >
                Clear Key
              </button>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Your API key is stored safely in your browser’s <code className="font-mono text-[10px]">localStorage</code> and sent securely to your Next.js API handler.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-sm shadow-indigo-600/30"
          >
            {saved ? (
              <>
                <Check size={14} className="text-emerald-200" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
