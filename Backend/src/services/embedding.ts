import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const DEFAULT_LLM_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

type TransformersModule = {
  env: {
    allowLocalModels: boolean;
    allowRemoteModels: boolean;
    cacheDir?: string;
  };
  pipeline: (
    task: 'feature-extraction',
    model: string,
    options?: {
      quantized?: boolean;
    }
  ) => Promise<FeatureExtractionPipeline>;
};

type FeatureExtractionPipeline = (
  input: string,
  options: {
    pooling: 'mean';
    normalize: boolean;
  }
) => Promise<{
  data: Float32Array | number[];
  tolist?: () => number[] | number[][];
}>;

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

let embeddingPipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

// Preserve native dynamic import so CommonJS output can load ESM-only packages.
const loadModule = new Function(
  'specifier',
  'return import(specifier);'
) as (specifier: string) => Promise<TransformersModule>;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }

  return value;
}

function getLlmApiKey(): string {
  const llmApiKey = process.env.LLM_API_KEY?.trim();
  if (llmApiKey) {
    return llmApiKey;
  }

  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiApiKey) {
    return openAiApiKey;
  }

  throw new Error(
    'LLM_API_KEY environment variable is not set (OPENAI_API_KEY is also accepted)'
  );
}

function getChatCompletionsUrl(): string {
  const configuredBaseUrl =
    process.env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL;

  return configuredBaseUrl.endsWith('/chat/completions')
    ? configuredBaseUrl
    : `${configuredBaseUrl.replace(/\/+$/, '')}/chat/completions`;
}

function extractMessageContent(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text?.trim() || '')
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = (async () => {
      const { env, pipeline } = await loadModule('@xenova/transformers');
      const cacheDir =
        process.env.TRANSFORMERS_CACHE_DIR ||
        path.join(process.cwd(), '.cache', 'transformers');

      await mkdir(cacheDir, { recursive: true });

      env.allowLocalModels = true;
      env.allowRemoteModels = true;
      env.cacheDir = cacheDir;

      return pipeline('feature-extraction', EMBEDDING_MODEL, {
        quantized: false,
      });
    })();
  }

  return embeddingPipelinePromise;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Cannot generate an embedding for empty text');
  }

  const extractor = await getEmbeddingPipeline();
  const output = await extractor(normalizedText, {
    pooling: 'mean',
    normalize: true,
  });

  if (typeof output.tolist === 'function') {
    const values = output.tolist();
    return Array.isArray(values[0]) ? (values[0] as number[]) : (values as number[]);
  }

  return Array.from(output.data);
}

export async function generateResponse(
  systemPrompt: string,
  userQuestion: string
): Promise<string> {
  const apiKey = getLlmApiKey();
  const model = process.env.LLM_MODEL?.trim() || DEFAULT_LLM_MODEL;
  const response = await fetch(getChatCompletionsUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userQuestion,
        },
      ],
      temperature: 0,
    }),
  });

  const payload = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ||
        `LLM request failed with status ${response.status}`
    );
  }

  const content = extractMessageContent(payload);

  if (!content) {
    throw new Error('Empty response from LLM provider');
  }

  return content;
}
