const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface SourceItem {
  id: string
  question: string
  answer: string
  category: string
  score: number
}

export interface ChatResponse {
  answer: string
  sources: SourceItem[]
  latency_ms: number
}

interface IngestResponse {
  message: string
  ingested: number
  skipped: number
  total_documents: number
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | { error?: string }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new Error(errorMessage || `Request failed with status ${response.status}`)
  }

  return payload as T
}

export async function ingestKnowledgeBase(): Promise<IngestResponse> {
  const response = await fetch(`${API_BASE_URL}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return readJson<IngestResponse>(response)
}

export async function queryRag(question: string, topK = 3): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      top_k: topK,
    }),
  })

  return readJson<ChatResponse>(response)
}
