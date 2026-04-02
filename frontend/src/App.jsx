import { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import ResultPanel from './components/ResultPanel'
import EndpointTester from './components/EndpointTester'
import './index.css'

/**
 * App Component - Root application component for DocAnalyze API Dashboard.
 * 
 * Provides two tabbed views:
 * - Document Analyzer: Upload and analyze documents with AI
 * - API Endpoint Tester: Test the live API for hackathon evaluators
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('analyzer')
  const [result, setResult] = useState(null)

  const handleResult = (data) => setResult(data)
  const handleReset = () => setResult(null)

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.981 7.494a3 3 0 11-4.243-4.243M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent" id="app-title">
              DocAnalyze API
            </h1>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot"></span>
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm">AI-Powered Document Analysis & Extraction</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 glass-panel p-1.5" id="tab-nav">
          <button
            onClick={() => { setActiveTab('analyzer'); setResult(null) }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'analyzer'
                ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            id="tab-analyzer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Document Analyzer
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'tester'
                ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            id="tab-tester"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            API Endpoint Tester
          </button>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === 'analyzer' && (
            result ? (
              <ResultPanel result={result} onReset={handleReset} />
            ) : (
              <UploadPanel onResult={handleResult} />
            )
          )}
          {activeTab === 'tester' && <EndpointTester />}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-slate-600">
          <p>Built with FastAPI • Google Gemini • React • Tailwind CSS</p>
        </footer>
      </div>
    </div>
  )
}
