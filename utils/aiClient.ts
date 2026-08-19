import OpenAI from 'openai';

export type AIProvider = 'groq' | 'grok' | 'openai';

export interface AIClientConfig {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
}

export const PROVIDER_DEFAULTS: Record<
  AIProvider,
  {
    name: string;
    baseURL: string;
    defaultModel: string;
    supportedModels: Array<{ id: string; name: string; tag?: string }>;
    envKeyName: string;
    link: string;
  }
> = {
  groq: {
    name: 'Groq (Free & Ultra-fast)',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    supportedModels: [
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', tag: 'Recommended' },
      { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', tag: 'Fast' },
      { id: 'groq/compound', name: 'Groq Compound', tag: 'Production' },
      { id: 'groq/compound-mini', name: 'Groq Compound Mini', tag: 'Fast' },
    ],
    envKeyName: 'GROQ_API_KEY',
    link: 'https://console.groq.com/keys',
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    supportedModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Recommended' },
      { id: 'gpt-4o', name: 'GPT-4o', tag: 'High Quality' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tag: 'Legacy' },
    ],
    envKeyName: 'OPENAI_API_KEY',
    link: 'https://platform.openai.com/api-keys',
  },
  grok: {
    name: 'Grok (xAI)',
    baseURL: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    supportedModels: [
      { id: 'grok-2-latest', name: 'Grok 2 Latest', tag: 'Recommended' },
      { id: 'grok-beta', name: 'Grok Beta', tag: 'Preview' },
    ],
    envKeyName: 'GROK_API_KEY',
    link: 'https://console.x.ai',
  },
};

export function resolveAIConfig(customConfig?: AIClientConfig): {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseURL: string;
} {
  let provider: AIProvider = customConfig?.provider || 'groq';
  let apiKey = customConfig?.apiKey?.trim() || '';

  // Auto-detect provider from API key prefix if provided
  if (apiKey) {
    if (apiKey.startsWith('gsk_')) {
      provider = 'groq';
    } else if (apiKey.startsWith('sk-')) {
      provider = 'openai';
    } else if (apiKey.startsWith('xai-')) {
      provider = 'grok';
    }
  } else {
    // Check environment variables
    if (provider === 'groq' && process.env.GROQ_API_KEY) {
      apiKey = process.env.GROQ_API_KEY;
    } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'grok' && (process.env.GROK_API_KEY || process.env.XAI_API_KEY)) {
      apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    } else {
      // Fallback to whichever env key is present
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
        apiKey = process.env.GROQ_API_KEY;
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai';
        apiKey = process.env.OPENAI_API_KEY;
      } else if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) {
        provider = 'grok';
        apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
      }
    }
  }

  const defaultInfo = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.groq;
  let model = customConfig?.model?.trim() || defaultInfo.defaultModel;

  // Prevent cross-provider model mismatches (e.g. asking OpenAI for llama models)
  if (provider === 'openai' && (model.startsWith('llama') || model.startsWith('grok') || !model)) {
    model = PROVIDER_DEFAULTS.openai.defaultModel;
  } else if (provider === 'groq' && (model.startsWith('gpt') || model.startsWith('grok') || !model)) {
    model = PROVIDER_DEFAULTS.groq.defaultModel;
  } else if (provider === 'grok' && (model.startsWith('gpt') || model.startsWith('llama') || !model)) {
    model = PROVIDER_DEFAULTS.grok.defaultModel;
  }

  // Migrate legacy deprecated groq model ids
  if (
    provider === 'groq' &&
    (model.includes('llama') ||
      model.includes('qwen-2.5-32b') ||
      model === 'mixtral-8x7b-32768' ||
      model === 'gemma2-9b-it' ||
      !model)
  ) {
    model = 'openai/gpt-oss-120b';
  }

  return {
    provider,
    apiKey,
    model,
    baseURL: defaultInfo.baseURL,
  };
}

export async function generateAICompletion({
  systemPrompt,
  userPrompt,
  jsonMode = false,
  config,
}: {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  config?: AIClientConfig;
}): Promise<string> {
  const resolved = resolveAIConfig(config);

  if (!resolved.apiKey) {
    throw new Error(
      `No API key found for ${PROVIDER_DEFAULTS[resolved.provider].name}. Please configure your API key in Settings or set ${
        PROVIDER_DEFAULTS[resolved.provider].envKeyName
      } in .env.local`
    );
  }

  const client = new OpenAI({
    apiKey: resolved.apiKey,
    baseURL: resolved.baseURL,
  });

  const response = await client.chat.completions.create({
    model: resolved.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || '';
}
