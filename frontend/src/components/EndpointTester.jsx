import { useState, useRef } from 'react'

/**
 * EndpointTester Component
 * 
 * Developer tool for hackathon evaluators to test the live API endpoint.
 * Supports URL input, API key auth testing, optional file upload,
 * and displays response status, timing, and body.
 */
export default function EndpointTester() {
  const [endpointUrl, setEndpointUrl] = useState(
    `${import.meta.env.VITE_API_URL || window.location.origin}/api/document-analyze`
  )
  const [apiKey, setApiKey] = useState('')
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [responseTime, setResponseTime] = useState(null)
  const [statusCode, setStatusCode] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'docx'
    return 'image'
  }

  const getStatusBadge = (code) => {
    if (code >= 200 && code < 300) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    if (code >= 400 && code < 500) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
  }

  const handleTest = async () => {
    setIsLoading(true)
    setResult(null)
    setStatusCode(null)
    setResponseTime(null)
    const startTime = Date.now()

    try {
      let body
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binaryString = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i])
        }
        body = JSON.stringify({
          fileName: file.name,
          fileType: getFileType(file.name),
          fileBase64: btoa(binaryString),
        })
      } else {
        body = JSON.stringify({ fileName: 'test.pdf', fileType: 'pdf', fileBase64: 'dGVzdA==' })
      }

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body,
      })
      setResponseTime(Date.now() - startTime)
      setStatusCode(response.status)
      setResult(await response.json())
    } catch (err) {
      setResponseTime(Date.now() - startTime)
      setStatusCode(0)
      setResult({ error: err.message || 'Network error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="glass-panel p-4 flex items-center gap-3 border-blue-500/20">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">Test your live API endpoint. Upload a file or send a dummy payload to verify authentication.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="endpoint-url">API Endpoint URL</label>
        <input id="endpoint-url" type="text" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-mono"
          placeholder="https://your-app.onrender.com/api/document-analyze" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="tester-api-key">API Key</label>
        <input id="tester-api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          placeholder="sk_track2_..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">File Upload <span className="text-slate-600">(optional)</span></label>
        <div className={`drop-zone glass-panel p-6 border-2 border-dashed cursor-pointer text-center transition-all ${isDragOver ? 'border-blue-400 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500'}`}
          onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }} onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
          onClick={() => fileInputRef.current?.click()} id="tester-drop-zone">
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp"
            onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-slate-300 font-medium">{file.name}</span>
              <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Drop a file here or click to browse</p>
          )}
        </div>
      </div>

      <button onClick={handleTest} disabled={isLoading || !apiKey.trim()}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 ${isLoading || !apiKey.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'}`}
        id="test-endpoint-button">
        {isLoading ? (
          <><svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> Testing...</>
        ) : (
          <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg> Test Endpoint</>
        )}
      </button>

      {(statusCode !== null || result) && (
        <div className="space-y-4 animate-fade-slide-up">
          <div className="flex flex-wrap gap-4">
            {statusCode !== null && (
              <div className="glass-panel px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 uppercase">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(statusCode)}`}>{statusCode === 0 ? 'ERR' : statusCode}</span>
              </div>
            )}
            {responseTime !== null && (
              <div className="glass-panel px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 uppercase">Time</span>
                <span className="text-sm font-mono text-cyan-400">{responseTime}ms</span>
              </div>
            )}
            {statusCode !== null && (
              <div className="glass-panel px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 uppercase">Auth</span>
                {statusCode === 401 ? <span className="text-sm text-red-400 font-medium">✗ Invalid Key</span>
                  : statusCode >= 200 && statusCode < 500 ? <span className="text-sm text-emerald-400 font-medium">✓ Valid Key</span>
                  : <span className="text-sm text-slate-500 font-medium">— Unknown</span>}
              </div>
            )}
          </div>
          {result && (
            <div className="glass-panel p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Response Body</p>
              <pre className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] overflow-y-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
