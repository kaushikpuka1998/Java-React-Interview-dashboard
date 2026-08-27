#!/usr/bin/env node
/**
 * Generates frontend/public/sitemap.xml and robots.txt from the live question list.
 *
 * The sitemap must live on the same host as the URLs it lists, which is the
 * frontend origin — so it is written into public/ and shipped with the build
 * rather than served from the API.
 *
 *   API_BASE=https://api.example.com/api SITE_URL=https://example.com \
 *     node scripts/gen-sitemap.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const API_BASE = process.env.API_BASE || 'http://localhost:8082/api'
// Gated topics are hidden from anonymous API calls, so without a token the sitemap
// would only list the free sample. Pass an admin token to enumerate everything —
// gated pages still belong in the sitemap, paired with the paywall structured data.
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''
const SITE_URL = (process.env.SITE_URL || 'https://interviewreader.up.railway.app').replace(/\/+$/, '')
const PAGE_SIZE = 500

// Must match frontend/src/lib/slug.js exactly, or the sitemap points at 404s.
const slugify = (text) =>
  String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function fetchAll() {
  const out = []
  for (let page = 0; ; page++) {
    const res = await fetch(`${API_BASE}/questions?page=${page}&size=${PAGE_SIZE}`, {
      headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {},
    })
    if (!res.ok) throw new Error(`API returned ${res.status} — is the backend running?`)
    const data = await res.json()
    out.push(...(data.content || []))
    if (!data.totalPages || page + 1 >= data.totalPages) break
  }
  return out
}

function sitemapXml(questions) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...questions.map(q => {
      const slug = slugify(q.question || q.title)
      if (!slug) return null
      return `  <url>
    <loc>${xmlEscape(`${SITE_URL}/${slug}`)}</loc>
    <lastmod>${(q.updatedAt || q.createdAt || today).toString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    }).filter(Boolean),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

const robotsTxt = () => `# ${SITE_URL}
User-agent: *
Allow: /

# Application routes with no standalone content
Disallow: /admin
Disallow: /profile

Sitemap: ${SITE_URL}/sitemap.xml
`

async function main() {
  const questions = await fetchAll()
  const publicDir = join(ROOT, 'frontend', 'public')
  await mkdir(publicDir, { recursive: true })

  await writeFile(join(publicDir, 'sitemap.xml'), sitemapXml(questions))
  await writeFile(join(publicDir, 'robots.txt'), robotsTxt())

  console.log(`sitemap.xml  ${questions.length + 1} urls`)
  if (!AUTH_TOKEN) {
    console.warn('NOTE: no AUTH_TOKEN set — gated topics were excluded.')
    console.warn('      Set AUTH_TOKEN=<admin jwt> to list every question.')
  }
  console.log(`robots.txt   -> ${SITE_URL}/sitemap.xml`)
  if (questions.length >= 50000) {
    console.warn('WARNING: over 50,000 urls — split into a sitemap index.')
  }
}

main().catch(err => { console.error(err.message); process.exit(1) })
