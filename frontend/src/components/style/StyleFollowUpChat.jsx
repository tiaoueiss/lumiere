import { useState, useRef, useEffect } from 'react'
import { askStyleFollowUp } from '../../utils/styleAnalysis'

const STARTER_QUESTIONS = [
  'What colors should I wear for a formal event?',
  'Can I wear silver or should I stick to gold?',
  'Give me three outfit ideas from my palette.',
]

function cleanAssistantText(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .trim()
}

export default function StyleFollowUpChat({ analysis }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Your analysis is ready. Ask me anything about your colors, metals, hair shades, outfits, or jewelry choices.',
    },
  ])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const submitQuestion = async (nextQuestion = question) => {
    const cleanQuestion = nextQuestion.trim()
    if (!cleanQuestion || busy) return

    const history = messages.filter(message => ['user', 'assistant'].includes(message.role))
    const userMessage = { role: 'user', content: cleanQuestion }

    setMessages(current => [...current, userMessage])
    setQuestion('')
    setError('')
    setBusy(true)

    try {
      const answer = await askStyleFollowUp({
        analysis,
        question: cleanQuestion,
        history,
      })
      setMessages(current => [...current, { role: 'assistant', content: answer }])
    } catch (err) {
      setError(err.message)
      setMessages(current => current.filter(message => message !== userMessage))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl border border-cream-3 overflow-hidden">
      <div className="px-6 py-5 border-b border-cream-3 bg-cream-2">
        <p className="font-ui text-xs tracking-[3px] text-gold-dark uppercase mb-2">Ask Lumiere</p>
        <h3 className="font-display text-2xl text-ink">Follow-up style questions</h3>
        <p className="font-body text-xs text-muted leading-relaxed mt-2">
          Continue the conversation using your existing analysis. No new photo analysis is run here.
        </p>
      </div>

      <div className="px-5 py-5 flex flex-col gap-3 max-h-[360px] overflow-y-auto bg-white">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-2xl px-4 py-3 max-w-[88%] ${
              message.role === 'user'
                ? 'self-end bg-ink text-cream'
                : 'self-start bg-cream text-ink-2'
            }`}
          >
            <p className="font-body text-sm leading-relaxed whitespace-pre-line">
              {message.role === 'assistant' ? cleanAssistantText(message.content) : message.content}
            </p>
          </div>
        ))}
        {busy && (
          <div className="self-start bg-cream rounded-2xl px-4 py-3">
            <p className="font-body text-sm text-muted">Thinking through your style profile...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 pb-5">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {STARTER_QUESTIONS.map(starter => (
              <button
                key={starter}
                type="button"
                onClick={() => submitQuestion(starter)}
                disabled={busy}
                className="font-body text-[11px] text-gold-dark border border-gold/25 rounded-full px-3 py-1.5 hover:bg-gold-pale transition-colors disabled:opacity-60"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="font-body text-xs text-red-600 mb-3">{error}</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitQuestion()
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="Ask about colors, outfits, metals, hair shades..."
            className="flex-1 border border-cream-3 rounded-full px-5 py-3 font-body text-sm text-ink outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={busy || question.trim().length < 3}
            className="font-ui text-xs tracking-[2px] uppercase bg-gradient-to-br from-gold to-gold-dark text-white px-7 py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  )
}
