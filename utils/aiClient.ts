import OpenAI from 'openai';

export type AIProvider = 'groq' | 'grok' | 'openai';

export interface AIClientConfig {
  provider?: AIProvider;
  apiKey?: string;
  model?: string;
}

export const PROVIDER_DEFAULTS: Record<
  AIProvider,
  { name: string; baseURL: string; defaultModel: string; envKeyName: string; link: string }
> = {
  groq: {
    name: 'Groq (Free 14.4k RPD / High TPM)',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    envKeyName: 'GROQ_API_KEY',
    link: 'https://console.groq.com/keys',
  },
  grok: {
    name: 'Grok (xAI)',
    baseURL: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    envKeyName: 'GROK_API_KEY',
    link: 'https://console.x.ai',
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    envKeyName: 'OPENAI_API_KEY',
    link: 'https://platform.openai.com/api-keys',
  },
};

export function resolveAIConfig(customConfig?: AIClientConfig): {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseURL: string;
} {
  let provider: AIProvider = customConfig?.provider || 'groq';

  let apiKey = customConfig?.apiKey || '';
  if (!apiKey) {
    if (provider === 'groq') apiKey = process.env.GROQ_API_KEY || '';
    else if (provider === 'grok') apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY || '';

    // Fallback to whichever env key is present
    if (!apiKey) {
      if (process.env.GROQ_API_KEY) {
        provider = 'groq';
        apiKey = process.env.GROQ_API_KEY;
      } else if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) {
        provider = 'grok';
        apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
      } else if (process.env.OPENAI_API_KEY) {
        provider = 'openai';
        apiKey = process.env.OPENAI_API_KEY;
      }
    }
  }

  const defaultInfo = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.groq;
  let model = customConfig?.model || defaultInfo.defaultModel;

  // Auto-migrate rate-limited legacy 70B model to high-limit 8B instant model
  if (provider === 'groq' && (model === 'llama-3.3-70b-versatile' || model === 'llama3-70b-8192')) {
    model = 'llama-3.1-8b-instant';
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
