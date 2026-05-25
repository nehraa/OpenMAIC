import { NextResponse } from 'next/server';

// MiniMax provider configuration from environment
const LLM_ENV_MAP: Record<string, string> = {
  MINIMAX: 'minimax',
};

function getEnvProviders(): Record<string, { models?: string[]; baseUrl?: string }> {
  const result: Record<string, { models?: string[]; baseUrl?: string }> = {};

  const envApiKey = process.env.MINIMAX_API_KEY;
  const envBaseUrl = process.env.MINIMAX_BASE_URL;
  const envModelsStr = process.env.MINIMAX_MODELS;
  const envModels = envModelsStr
    ? envModelsStr.split(',').map((m) => m.trim()).filter(Boolean)
    : undefined;

  if (envApiKey || envBaseUrl) {
    result.minimax = {};
    if (envModels?.length) result.minimax.models = envModels;
    if (envBaseUrl) result.minimax.baseUrl = envBaseUrl;
  }

  return result;
}

export async function GET() {
  return NextResponse.json({
    providers: getEnvProviders(),
    tts: {},
    asr: {},
    pdf: {},
    image: {},
    video: {},
    webSearch: {},
  });
}