// Converts the raw interview dumps in "files 3" into the repo's ### Qn. question format
// under misc/, so build-questions.mjs can parse them into the Miscellaneous section.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = '/Users/kgstrivers/Downloads/files 3'
const outDir = path.join(root, 'misc')
fs.mkdirSync(outDir, { recursive: true })

const SOURCES = [
  { file: '01_Basic_Java_Questions_and_Answers.md', out: '01-basic-java-coding.md', category: 'Basic Java Coding', lang: 'java' },
  { file: '02_DSA_Implementation.md', out: '02-dsa-implementation.md', category: 'DSA Implementation', lang: 'java' },
  { file: '03_Spring_and_Microservices_Implementation.md', out: '03-spring-microservices-impl.md', category: 'Spring & Microservices', lang: 'java' },
  { file: '04_eBay_Questions.md', out: '04-ebay-interview.md', category: 'eBay Interview', lang: 'js' },
]

// Split a section body into prose + code blocks, preserving order-ish (prose first, then code).
function splitBody(body) {
  const fenceRe = /```[\s\S]*?```/g
  const codeBlocks = body.match(fenceRe) || []
  const prose = body.replace(fenceRe, '\n').split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .filter(l => l.trim() !== '')
    // drop markdown noise that would confuse the parser
    .filter(l => !/^#{1,6}\s/.test(l))
    .filter(l => !/^\|.*\|$/.test(l))       // table rows
    .filter(l => !/^-{3,}\s*$/.test(l))
    .join('\n')
    .trim()
  return { prose, codeBlocks }
}

function difficultyFor(title, body) {
  const t = (title + ' ' + body).toLowerCase()
  if (/(design|lru|topolog|quicksort|deadlock|producer-consumer|consistent|circuit breaker|monitor|distributed|schema|median|infix|unique binary)/.test(t)) return 'Hard'
  if (/(reverse an array|count the number of words|convert.*uppercase|generate a username|simple|basic|print the|level order|count the number of nodes|weird-sum|centralize|maximum occurring)/.test(t)) return 'Basic'
  return 'Intermediate'
}

const importRows = []   // QuestionInput objects for POST /api/questions/bulk
let globalNum = 0
for (const src of SOURCES) {
  const raw = fs.readFileSync(path.join(srcDir, src.file), 'utf-8')
  // Sections look like:  ## 1. Title
  const parts = raw.split(/\n## \d+\.\s+/)
  // parts[0] is the file header + Contents; skip it. Re-extract titles.
  const titleMatches = [...raw.matchAll(/\n## \d+\.\s+(.*)/g)].map(m => m[1].trim())
  const lines = []
  lines.push(`# Miscellaneous — ${src.category} Interview Questions`)
  lines.push('')
  lines.push('*Real-world coding/implementation questions compiled from interview rounds.*')
  lines.push('')
  lines.push('---')
  lines.push('')

  for (let i = 1; i < parts.length; i++) {
    let title = (titleMatches[i - 1] || `Question ${i}`).replace(/…$/, '').trim()
    // strip trailing markdown/link noise
    title = title.replace(/`/g, '').replace(/\s+/g, ' ').slice(0, 160)
    const body = parts[i]
    const { prose, codeBlocks } = splitBody(body)
    if (!prose && codeBlocks.length === 0) continue
    globalNum++
    const diff = difficultyFor(title, body)
    lines.push(`### Q${globalNum}. ${title}`)
    lines.push(`**Difficulty:** \`${diff}\``)
    lines.push(`**Category:** ${src.category}`)
    lines.push('')
    lines.push('#### Answer')
    lines.push(prose || 'See the implementation below.')
    lines.push('')
    lines.push('#### Code Example / Key Takeaways')
    if (codeBlocks.length) {
      lines.push(codeBlocks.join('\n\n'))
    } else {
      lines.push('```' + src.lang + '\n// (conceptual — see the answer above)\n```')
    }
    lines.push('')
    lines.push('---')
    lines.push('')

    // answer for the backend = prose + code (markdown, as the reader renders it)
    const answer = [prose, codeBlocks.join('\n\n')].filter(Boolean).join('\n\n')
    importRows.push({
      tech: 'misc',
      title,
      question: title,
      answer,
      difficulty: diff,
      category: src.category,
    })
  }
  fs.writeFileSync(path.join(outDir, src.out), lines.join('\n'))
  console.log(`Wrote ${src.out}`)
}

// Import payload for POST /api/questions/bulk (Miscellaneous section, tech="misc")
fs.writeFileSync(path.join(outDir, 'misc-questions.json'), JSON.stringify(importRows, null, 2))
console.log(`Wrote misc-questions.json (${importRows.length} rows)`)
console.log(`Total misc questions: ${globalNum}`)
