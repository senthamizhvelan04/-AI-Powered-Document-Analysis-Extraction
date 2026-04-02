import { useState } from 'react'

/**
 * ResultPanel Component
 *
 * Displays the AI analysis results including summary, extracted entities,
 * sentiment classification, and raw JSON. Renders with fade + slide-up
 * animation for a polished reveal effect.
 */
export default function ResultPanel({ result, onReset }) {
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  /**
   * Returns Tailwind classes for the sentiment badge based on classification.
   */
  const getSentimentStyle = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
      case 'Negative':
        return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-red-500/10'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30 shadow-slate-500/10'
    }
  }

  /**
   * Returns Tailwind classes for entity category pills.
   */
  const entityStyles = {
    names: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    dates: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    organizations: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    locations: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    amounts: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  }

  const entityLabels = {
    names: '👤 Names',
    dates: '📅 Dates',
    organizations: '🏢 Organizations',
    locations: '📍 Locations',
    amounts: '💰 Amounts',
  }

  /**
   * Copies the raw JSON response to clipboard with visual feedback.
   */
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(result, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100" id="result-header">Analysis Complete</h2>
          <p className="text-sm text-slate-500">{result.fileName}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-panel p-6" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="font-semibold text-slate-200">Summary</h3>
        </div>
        <p className="text-slate-300 leading-relaxed text-sm" id="summary-text">{result.summary}</p>
      </div>

      {/* Entities Section */}
      <div className="glass-panel p-6" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <h3 className="font-semibold text-slate-200">Extracted Entities</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(entityLabels).map(([key, label]) => (
            <div key={key}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
              <div className="flex flex-wrap gap-2">
                {result.entities?.[key]?.length > 0 ? (
                  result.entities[key].map((entity, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${entityStyles[key]}`}
                    >
                      {entity}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-600 italic">None found</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Badge */}
      <div className="glass-panel p-6 flex flex-col items-center justify-center" style={{ animationDelay: '0.3s' }}>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Document Sentiment</p>
        <div
          className={`px-8 py-3 rounded-2xl text-lg font-bold border shadow-lg ${getSentimentStyle(result.sentiment)}`}
          id="sentiment-badge"
        >
          {result.sentiment === 'Positive' && '😊 '}
          {result.sentiment === 'Negative' && '😟 '}
          {result.sentiment === 'Neutral' && '😐 '}
          {result.sentiment}
        </div>
      </div>

      {/* Raw JSON Toggle */}
      <div className="glass-panel overflow-hidden" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full p-4 flex items-center justify-between text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          id="toggle-json"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            {showJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
          </span>
          <svg className={`w-4 h-4 transition-transform duration-300 ${showJson ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showJson && (
          <div className="px-4 pb-4 animate-fade-slide-up">
            <div className="relative">
              <button
                onClick={handleCopyJson}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
                id="copy-json-button"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <pre className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Analyze Another Button */}
      <button
        onClick={onReset}
        className="w-full py-3 rounded-xl font-medium text-sm border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800/50 transition-all duration-300"
        id="reset-button"
      >
        ← Analyze Another Document
      </button>
    </div>
  )
}
