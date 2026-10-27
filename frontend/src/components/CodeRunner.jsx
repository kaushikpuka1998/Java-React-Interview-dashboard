import { useEffect, useRef, useState } from 'react'
import { isLoggedIn } from '../lib/auth.js'
import { runCode, runTests, fetchSubmissions, fetchSubmission } from '../lib/code.js'
import { trackClick } from '../lib/analytics.js'
import TestResults from './TestResults.jsx'
import CodeEditor, { BRACE_LANGUAGES, FONTS, formatBraces } from './CodeEditor.jsx'

const LANGUAGES = [
  { key: 'cpp', label: 'C++', starter: ['#include <iostream>', 'int main() {', '    std::cout << "Hello, world!" << std::endl;', '    return 0;', '}'] },
  { key: 'c', label: 'C', starter: ['#include <stdio.h>', 'int main(void) {', '    printf("Hello, world!\\n");', '    return 0;', '}'] },
  { key: 'python', label: 'Python', starter: ['print("Hello, world!")'] },
  { key: 'ruby', label: 'Ruby', starter: ['puts "Hello, world!"'] },
  { key: 'rust', label: 'Rust', starter: ['fn main() {', '    println!("Hello, world!");', '}'] },
  { key: 'csharp', label: 'C#', starter: ['using System;', 'class Program {', '    static void Main() {', '        Console.WriteLine("Hello, world!");', '    }', '}'] },
  { key: 'php', label: 'PHP', starter: ['<?php', 'echo "Hello, world!\\n";'] },
  { key: 'swift', label: 'Swift', starter: ['print("Hello, world!")'] },
]


// File extensions each language accepts, for the upload button.
const EXTENSIONS = {
  cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.h'], c: ['.c', '.h'], python: ['.py'], go: ['.go'], ruby: ['.rb'],
  rust: ['.rs'], kotlin: ['.kt', '.kts'], csharp: ['.cs'], php: ['.php'], swift: ['.swift'], java: ['.java'],
}
const MAX_FILE_BYTES = 100_000

const languageLabel = key => LANGUAGES.find(l => l.key === key)?.label || key

const starterFor = key => LANGUAGES.find(l => l.key === key).starter.join('\n')

// Code box for practice problems. Runs on the server for signed-in members only.
export default function CodeRunner({ problemId, starters = null }) {
  // Coding problems offer only the languages they have a starter for. Own-code practice offers all of them.
  const starterKeys = starters ? Object.keys(starters) : []
  const options = starters && starterKeys.length ? LANGUAGES.filter(l => starterKeys.includes(l.key)) : LANGUAGES
  const firstLanguage = starters && options.length ? options[0].key : 'cpp'
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [language, setLanguage] = useState(firstLanguage)
  // A coding problem starts from its starter for that language. Own-code practice starts from Hello world.
  // Drafts are kept in the browser per problem and language, so a refresh does not lose the code.
  const draftKey = lang => `ir_draft_${problemId ?? 'custom'}_${lang}`
  const readDraft = lang => localStorage.getItem(draftKey(lang))
  const [code, setCode] = useState(() => readDraft(firstLanguage) ?? (problemId ? (starters?.[firstLanguage] ?? '') : starterFor('cpp')))
  const updateCode = (value, lang = language) => { setCode(value); localStorage.setItem(draftKey(lang), value) }
  const [stdin, setStdin] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const signedIn = isLoggedIn()
  const fileRef = useRef(null)
  const [status, setStatus] = useState('')
  const [history, setHistory] = useState([])
  const [font, setFont] = useState(() => localStorage.getItem('ir_code_font') || 'consolas')
  const chooseFont = key => { setFont(key); localStorage.setItem('ir_code_font', key) }

  // Loads a file into the editor. A recognised extension also switches the language.
  const onFile = e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_BYTES) { setError('That file is too large (max 100 KB).'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const name = file.name.toLowerCase()
      const match = LANGUAGES.find(l => (EXTENSIONS[l.key] || []).some(ext => name.endsWith(ext)))
      if (match) setLanguage(match.key)
      updateCode(String(reader.result))
      setResult(null)
      setError('')
    }
    reader.readAsText(file)
  }

  const pickLanguage = key => {
    trackClick(`code_language:${key}`)
    setLanguage(key)
    setCode(readDraft(key) ?? (problemId ? (starters?.[key] ?? '') : starterFor(key)))
    setResult(null)
    setError('')
  }

  const loadHistory = () => { if (problemId && isLoggedIn()) fetchSubmissions(problemId).then(setHistory) }
  useEffect(loadHistory, [problemId])

  // Run checks the visible tests. Submit checks every test and saves the attempt.
  const check = async (saveIt = false) => {
    setTesting(true); setError(''); setTestResult(null)
    try {
      setTestResult(await runTests({ problemId, language, code, submit: saveIt, onStatus: setStatus }))
      if (saveIt) loadHistory()
    } catch (e) {
      setError(e.message)
    } finally {
      setTesting(false)
      setStatus('')
    }
  }

  const run = async () => {
    trackClick(`code_run:${language}`)
    setRunning(true); setError(''); setResult(null); setTestResult(null)
    try {
      setResult(await runCode({ language, code, stdin, problemId, onStatus: setStatus }))
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
      setStatus('')
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Try it</h3>
        <div className="flex items-center gap-2">
          {BRACE_LANGUAGES.has(language) && (
            <button type="button" onClick={() => updateCode(formatBraces(code))} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700">Format</button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-track="code_upload"
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            Upload file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={(EXTENSIONS[language] || []).join(',')}
            onChange={onFile}
            className="hidden"
            aria-label="Upload a code file"
          />

            <select
            value={font}
            onChange={e => chooseFont(e.target.value)}
            aria-label="Editor font"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {Object.entries(FONTS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
          </select>
            <select
            value={language}
            onChange={e => pickLanguage(e.target.value)}
            aria-label="Language"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {options.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <CodeEditor value={code} onChange={updateCode} language={language} font={font} />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={problemId ? () => check(false) : run}
          disabled={!signedIn || running || testing || !code.trim()}
          data-track="code_run"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {problemId ? (testing ? 'Checking…' : 'Run') : (running ? 'Running…' : 'Run')}
        </button>
        {problemId && (
          <button
            type="button"
            onClick={run}
            disabled={!signedIn || running || testing || !code.trim()}
            data-track="code_run_custom"
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800"
          >
            {running ? 'Running…' : 'Run custom input'}
          </button>
        )}
        {problemId && (
          <button
            type="button"
            onClick={() => check(true)}
            disabled={!signedIn || testing || !code.trim()}
            data-track="code_submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </button>
        )}
        {!problemId && (
          <button
            type="button"
            onClick={() => setShowInput(v => !v)}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {showInput ? 'Hide input' : 'Add input'}
          </button>
        )}
        {!signedIn && <span className="text-xs text-slate-500 dark:text-slate-400">Sign in to run code.</span>}
      </div>

      {(problemId || showInput) && (
        <div className="mt-3">
          {problemId && (
            <label htmlFor="custom-input" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Custom input <span className="font-normal text-slate-500 dark:text-slate-400">(used by Run custom input only)</span>
            </label>
          )}
          <textarea
            id="custom-input"
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows={3}
            placeholder="Input for your program (optional)"
            aria-label="Program input"
            className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-[13px] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      )}

      {status && <p className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400">{status}</p>}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {testResult && <TestResults data={testResult} />}

      {problemId && history.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Your submissions</p>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {history.map(h => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => fetchSubmission(h.id).then(d => {
                    updateCode(d.code, d.language); setLanguage(d.language); setResult(null)
                    setTestResult({ passed: d.passed, total: d.total, results: d.results })
                  })}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span className={h.status === 'Accepted' ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-rose-600 dark:text-rose-400'}>{h.status}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{h.passed}/{h.total} · {languageLabel(h.language)} · {new Date(h.createdAt).toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {result.status}{result.time ? ` · ${result.time}s` : ''}{result.memoryKb ? ` · ${Math.round(result.memoryKb / 1024)} MB` : ''}
          </p>
          {result.compileOutput && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-red-950 p-3 text-xs text-red-200">{result.compileOutput}</pre>}
          {result.stdout && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">{result.stdout}</pre>}
          {result.stderr && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-red-950 p-3 text-xs text-red-200">{result.stderr}</pre>}
          {!result.stdout && !result.stderr && !result.compileOutput && <p className="text-sm text-slate-500 dark:text-slate-400">No output.</p>}
        </div>
      )}
    </section>
  )
}
