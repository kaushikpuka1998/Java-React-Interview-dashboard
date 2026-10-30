import { useEffect, useState } from 'react'
import TopBar from './TopBar.jsx'
import Footer from './Footer.jsx'
import { fetchStats } from '../lib/api.js'
import { fetchCompanies } from '../lib/codingProblems.js'
import { techBadge, techLabel } from '../lib/badges.js'
import { setDefaultSeo } from '../lib/seo.js'
import { useFeatures } from '../lib/features.js'
import FeedbackForm, { focusFeedback } from './FeedbackForm.jsx'

// DSA sheets that open on this site, using our own coding problems.
// Hidden until the sheet problems are in the database: set to true to show the section on the home page.
const SHOW_DSA_SHEETS = false
const SHEETS = [
  { name: "Striver's A2Z DSA Sheet", by: 'Striver (TakeUForward)', count: 433, text: 'A full roadmap from basics to advanced topics.', href: '/sheets/striver-a2z', internal: true },
  { name: 'Love Babbar DSA Sheet', by: 'Love Babbar', count: 430, text: 'Placement-focused list covering every major concept.', href: '/sheets/love-babbar', internal: true },
]

const LINKS = [
  { href: '/questions', title: 'Interview questions', text: 'Read answers with code examples and diagrams, and track what you have covered.' },
  { href: '/problems', title: 'Coding problems', text: 'Solve problems with test cases and run them online.', flag: 'code_practice' },
  { href: '/practice', title: 'Practice editor', text: 'A free online editor for Java, Python, C++, Go and more.', flag: 'code_practice' },
  { href: '/resume', title: 'Resume builder', text: 'Pick a LaTeX template and export a PDF.', flag: 'resume_builder' },
]

export default function HomePage() {
  const features = useFeatures()
  const [stats, setStats] = useState(null)
  const [companies, setCompanies] = useState([])
  useEffect(() => { fetchStats().then(setStats).catch(() => {}); fetchCompanies().then(setCompanies).catch(() => {}) }, [])
  useEffect(() => { setDefaultSeo(stats?.total) }, [stats?.total])

  // Arriving from the footer link on another page (/#feedback): the section only exists after the first render.
  useEffect(() => { if (window.location.hash === '#feedback') { setTimeout(focusFeedback, 150); setTimeout(focusFeedback, 900) } }, [])

  const topics = Object.entries(stats?.byTech || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-900">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <section className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-5xl dark:text-slate-100">
            {stats?.total ? `${stats.total.toLocaleString()}+ ` : ''}interview questions, with real answers
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Java, React, Node.js, Go, SQL, system design, Kafka and microservices. Read, practise and track your progress.
          </p>
          <a href="/questions" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Start reading</a>
        </section>

        {features.mock_interview !== false && features.new_badge_interview === true && (
          <a href="/interview" aria-label="Book a free mock interview" className="mt-10 block overflow-hidden rounded-3xl shadow-lg transition hover:shadow-xl">
            <img src="/promo/mock-interview.png" alt="Free for 2 weeks: mock interviews with a real person. Book yours free." className="block h-auto w-full" />
          </a>
        )}

        {topics.length > 0 && (
          <section className="mt-12" aria-labelledby="topics">
            <h2 id="topics" className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">Browse by topic</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {topics.map(([tech, count]) => (
                <a key={tech} href={`/questions?tech=${encodeURIComponent(tech)}`} className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-950">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${techBadge(tech)}`}>{techLabel(tech)}</span>
                  <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{count.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">questions</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {SHOW_DSA_SHEETS && (
        <section className="mt-12" aria-labelledby="sheets">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="sheets" className="text-xl font-bold text-slate-900 dark:text-slate-100">DSA sheets</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SHEETS.map(s => (
              <a key={s.name} href={s.href} className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-950">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name} →</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.by} · {s.count} problems</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
              </a>
            ))}
          </div>
        </section>
        )}

        {companies.length > 0 && features.code_practice !== false && (
          <section className="mt-12" aria-labelledby="companies">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 id="companies" className="text-xl font-bold text-slate-900 dark:text-slate-100">Coding problems by company</h2>
              <a href="/problems" className="text-sm text-blue-600 hover:underline dark:text-blue-400">All problems →</a>
            </div>
            <div className="flex flex-wrap gap-2">
              {companies.slice(0, 24).map(c => (
                <a key={c.name} href={`/problems?company=${encodeURIComponent(c.name)}`} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:shadow-md dark:bg-slate-950 dark:text-slate-100">
                  {c.name} <span className="text-slate-400">{c.count}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="More ways to prepare">
          {LINKS.filter(l => !l.flag || features[l.flag] !== false).map(l => (
            <a key={l.href} href={l.href} className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-950">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{l.title} →</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{l.text}</p>
            </a>
          ))}
        </section>
        <section id="feedback" className="mt-12 scroll-mt-20" aria-labelledby="fb">
          <h2 id="fb" className="mb-1 text-center text-xl font-bold text-slate-900 dark:text-slate-100">Feedback</h2>
          <p className="mb-4 text-center text-sm text-slate-600 dark:text-slate-400">Tell us what to improve. We read every message.</p>
          <FeedbackForm />
        </section>
      </main>
      <Footer />
    </div>
  )
}
