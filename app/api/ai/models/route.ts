import { NextRequest, NextResponse } from 'next/server';
import { resolveAIConfig, AIClientConfig, PROVIDER_DEFAULTS } from '@/utils/aiClient';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  let provider = 'groq';
  try {
    const body = await req.json();
    const { aiConfig } = body;
    provider = aiConfig?.provider || 'groq';

    const resolved = resolveAIConfig(aiConfig as AIClientConfig);

    if (!resolved.apiKey) {
      const fallback = PROVIDER_DEFAULTS[resolved.provider]?.supportedModels || [];
      return NextResponse.json({ models: fallback });
    }

    const client = new OpenAI({
      apiKey: resolved.apiKey,
      baseURL: resolved.baseURL,
    });

    const list = await client.models.list();
    const activeModels = list.data
      .filter((m) => !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('embed') && !m.id.includes('dall-e') && !m.id.includes('moderation') && !m.id.includes('babbage') && !m.id.includes('davinci') && !m.id.includes('vision') && !m.id.includes('guard'))
      .map((m) => ({
        id: m.id,
        name: m.id,
        tag: m.id.includes('120b') || m.id.includes('mini') ? 'Recommended' : undefined,
      }));

    return NextResponse.json({ models: activeModels.length > 0 ? activeModels : PROVIDER_DEFAULTS[resolved.provider]?.supportedModels || [] });
  } catch (error) {
    const fallback = PROVIDER_DEFAULTS[provider as keyof typeof PROVIDER_DEFAULTS]?.supportedModels || [];
    return NextResponse.json({ models: fallback, error: (error as Error).message });
  }
}
