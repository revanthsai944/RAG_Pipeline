import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import { ingestKnowledgeBase, queryRag, type ChatResponse } from './api'

type Message = {
  id: string
  role: 'assistant' | 'user'
  content: string
  latencyMs?: number
  sources?: ChatResponse['sources']
}

const starterPrompts = [
  'How do I create a Beem account?',
  'What countries do you support?',
  'How much does a transfer cost?',
]

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask me anything about the Beem knowledge base. I will answer from the indexed FAQs and show which sources I used.',
    },
  ])
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [status, setStatus] = useState('Connect the frontend to your RAG API and ingest the FAQs when you are ready.')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void handleIngest(false)
  }, [])

  async function handleIngest(showSuccessMessage: boolean) {
    setIsIngesting(true)
    setError(null)

    try {
      const result = await ingestKnowledgeBase()
      setStatus(
        `Knowledge base ready. ${result.total_documents} FAQs indexed, ${result.skipped} skipped.`
      )

      if (showSuccessMessage) {
        setMessages((current) => [
          ...current,
          {
            id: `ingest-${Date.now()}`,
            role: 'assistant',
            content: `I refreshed the knowledge base. ${result.total_documents} FAQs are available for chat.`,
          },
        ])
      }
    } catch (ingestError) {
      const message =
        ingestError instanceof Error ? ingestError.message : 'Failed to ingest the FAQ data.'
      setError(message)
      setStatus('Backend reached, but the knowledge base is not ready yet.')
    } finally {
      setIsIngesting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isLoading) {
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setIsLoading(true)
    setError(null)

    try {
      const result = await queryRag(trimmedQuestion)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        latencyMs: result.latency_ms,
        sources: result.sources,
      }

      setMessages((current) => [...current, assistantMessage])
    } catch (queryError) {
      const message =
        queryError instanceof Error ? queryError.message : 'The chat request failed.'
      setError(message)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            'I could not reach the RAG service for that message. Check that the backend is running and try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">RAG workspace</p>
          <h1>Support Chat</h1>
          <p className="sidebar-copy">
            A focused interface for asking questions against your indexed knowledge base.
          </p>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <h2>Knowledge Base</h2>
            <button
              className="ghost-button"
              onClick={() => void handleIngest(true)}
              disabled={isIngesting}
              type="button"
            >
              {isIngesting ? 'Syncing...' : 'Re-ingest'}
            </button>
          </div>
          <p>{status}</p>
          <p className="panel-note">
            The frontend uses the Vite proxy at <code>/api</code> during local development.
          </p>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Try asking</h2>
          </div>
          <div className="prompt-list">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                type="button"
                onClick={() => setQuestion(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <section className="panel error-panel">
            <div className="panel-heading">
              <h2>Issue</h2>
            </div>
            <p>{error}</p>
          </section>
        ) : null}
      </aside>

      <main className="chat-stage">
        <div className="chat-header">
          <div>
            <p className="eyebrow">Live answers</p>
            <h2>Chat with your indexed FAQs</h2>
          </div>
          <div className="status-pill">{isLoading ? 'Thinking...' : 'Ready'}</div>
        </div>

        <div className="message-list">
          {messages.map((message) => (
            <article key={message.id} className={`message message-${message.role}`}>
              <div className="message-meta">
                <span>{message.role === 'assistant' ? 'RAG assistant' : 'You'}</span>
                {message.latencyMs ? <span>{message.latencyMs} ms</span> : null}
              </div>
              <p className="message-content">{message.content}</p>

              {message.sources?.length ? (
                <details className="sources">
                  <summary className="sources-summary">
                    <span className="sources-title">Sources used</span>
                    <span className="sources-count">{message.sources.length} items</span>
                  </summary>
                  <div className="source-list">
                    {message.sources.map((source) => (
                      <section className="source-card" key={`${message.id}-${source.id}`}>
                        <div className="source-topline">
                          <span>{source.id}</span>
                          <span>{Math.round(source.score * 100)}% match</span>
                        </div>
                        <h3>{source.question}</h3>
                        <p>{source.answer}</p>
                        <div className="source-footer">{source.category}</div>
                      </section>
                    ))}
                  </div>
                </details>
              ) : null}
            </article>
          ))}

          {isLoading ? (
            <article className="message message-assistant message-pending">
              <div className="message-meta">
                <span>RAG assistant</span>
              </div>
              <p className="message-content">Searching the knowledge base and composing an answer...</p>
            </article>
          ) : null}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-label" htmlFor="question">
            Message
          </label>
          <div className="composer-row">
            <textarea
              id="question"
              className="composer-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a support question grounded in your RAG data..."
              rows={3}
            />
            <button className="send-button" disabled={isLoading || !question.trim()} type="submit">
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default App
