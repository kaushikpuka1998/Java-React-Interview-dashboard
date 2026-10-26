import { useState } from 'react'
import { isLoggedIn } from '../lib/auth.js'
import { runCode, runTests } from '../lib/code.js'
import CodeEditor from './CodeEditor.jsx'

const LANGUAGES = [
  { key: 'java', label: 'Java', starter: ['public class Main {', '    public static void main(String[] args) {', '        System.out.println("Hello, world!");', '    }', '}'] },
  { key: 'cpp', label: 'C++', starter: ['#include <iostream>', 'int main() {', '    std::cout << "Hello, world!" << std::endl;', '    return 0;', '}'] },
  { key: 'c', label: 'C', starter: ['#include <stdio.h>', 'int main(void) {', '    printf("Hello, world!\\n");', '    return 0;', '}'] },
  { key: 'python', label: 'Python', starter: ['print("Hello, world!")'] },
  { key: 'go', label: 'Go', starter: ['package main', '', 'import "fmt"', '', 'func main() {', '    fmt.Println("Hello, world!")', '}'] },
  { key: 'ruby', label: 'Ruby', starter: ['puts "Hello, world!"'] },
  { key: 'rust', label: 'Rust', starter: ['fn main() {', '    println!("Hello, world!");', '}'] },
  { key: 'kotlin', label: 'Kotlin', starter: ['fun main() {', '    println("Hello, world!")', '}'] },
  { key: 'csharp', label: 'C#', starter: ['using System;', 'class Program {', '    static void Main() {', '        Console.WriteLine("Hello, world!");', '    }', '}'] },
  { key: 'php', label: 'PHP', starter: ['<?php', 'echo "Hello, world!\\n";'] },
  { key: 'swift', label: 'Swift', starter: ['print("Hello, world!")'] },
]


const starterFor = key => LANGUAGES.find(l => l.key === key).starter.join('\n')

// Code box for practice problems. Runs on the server for signed-in members only.
export default function CodeRunner({ problemId }) {
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [language, setLanguage] = useState('cpp')
  const [code, setCode] = useState(() => starterFor('cpp'))
  const [stdin, setStdin] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const signedIn = isLoggedIn()

  const pickLanguage = key => {
    setLanguage(key)
    setCode(starterFor(key))
    setResult(null)
    setError('')
  }

  const check = async () => {
    setTesting(true); setError(''); setTestResult(null)
    try {
      setTestResult(await runTests({ problemId, language, code }))
    } catch (e) {
      setError(e.message)
    } finally {
      setTesting(false)
    }
  }

  const run = async () => {
    setRunning(true); setError(''); setResult(null)
    try {
      setResult(await runCode({ language, code, stdin }))
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Try it</h3>
        <select
          value={language}
          onChange={e => pickLanguage(e.target.value)}
          aria-label="Language"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
      </div>

      <CodeEditor value={code} onChange={setCode} language={language} />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={!signedIn || running || !code.trim()}
          data-track="code_run"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Running…' : 'Run'}
        </button>
        {problemId && (
          <button
            type="button"
            onClick={check}
            disabled={!signedIn || testing || !code.trim()}
            data-track="code_run_tests"
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            {testing ? 'Checking…' : 'Run tests'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowInput(v => !v)}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {showInput ? 'Hide input' : 'Add input'}
        </button>
        {!signedIn && <span className="text-xs text-slate-500 dark:text-slate-400">Sign in to run code.</span>}
      </div>

      {showInput && (
        <textarea
          value={stdin}
          onChange={e => setStdin(e.target.value)}
          rows={3}
          placeholder="Input for your program (optional)"
          aria-label="Program input"
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-[13px] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      )}

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {testResult && (
        <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className={`text-sm font-semibold ${testResult.passed === testResult.total ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {testResult.passed} of {testResult.total} tests passed
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {testResult.results.map(r => (
              <li key={r.number} className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-300">
                <span>Test {r.number}</span>
                <span className={r.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {r.passed ? 'Passed' : `Failed · ${r.status}`}
                </span>
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
