// Live, on-screen preview of the resume. It follows the same data and section order as the LaTeX,
// so the layout is close to the PDF. Exact output comes from the downloaded .tex file.

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Same markup as the server: **bold**, [label](url), -> arrow. Only http(s) and mailto links are kept.
export function md(s = '') {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => (/^(https?:|mailto:)/i.test(u) ? `<a href="${u}" target="_blank" rel="noreferrer">${t}</a>` : t))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/-&gt;/g, '→')
}

const ACCENT = 'rgb(31, 120, 95)'
const H = ({ children }) => (
  <h2 className="break-after-avoid mt-3 mb-1.5 border-b border-black pb-0.5 text-[14px] font-bold" style={{ color: ACCENT }}>{children}</h2>
)
const Html = ({ text, className = '' }) => <span className={className} dangerouslySetInnerHTML={{ __html: md(text) }} />
const Bullets = ({ items = [] }) => {
  const lines = items.filter(b => b && b.trim())
  if (!lines.length) return null
  return (
    <ul className="ml-5 mt-1 list-disc space-y-0.5 text-[12px] leading-snug">
      {lines.map((b, i) => <li key={i}><Html text={b} /></li>)}
    </ul>
  )
}

// US Letter with 0.5in margins: 8.5in wide (816px), 7.5in text width (720px), 10in text height (960px) per page.
const PAGE_TEXT_HEIGHT = 960

export default function ResumePreview({ data, layout, scale = 1, fit = false, fitHeight = 0 }) {
  const h = data.header || {}
  const t = (key, fallback) => (data.sectionTitles?.[key] || '').trim() || fallback
  const order = (layout || 'header,summary,skills,experience,projects,education,achievements').split(',').map(s => s.trim())
  const contact = [h.location, h.extra, h.email && `<a href="mailto:${esc(h.email)}">${esc(h.email)}</a>`, h.phone && esc(h.phone)]
    .filter(Boolean)
  const links = (h.links || []).filter(l => l.url)

  const blocks = {
    header: () => (
      <header key="header" className="text-center">
        <h1 className="text-[26px] font-bold leading-tight"><Html text={h.name} /></h1>
        {h.headline && <p className="text-[12px]"><Html text={h.headline} /></p>}
        {contact.length > 0 && (
          <p className="mt-1 text-[12px]" dangerouslySetInnerHTML={{ __html: contact.map(c => (c.startsWith('<') ? c : md(c))).join(' | ') }} />
        )}
        {links.length > 0 && (
          <p className="text-[12px]">{links.map((l, i) => (
            <span key={i}>{i > 0 && ' | '}<a href={l.url} target="_blank" rel="noreferrer">{l.label || l.url}</a></span>
          ))}</p>
        )}
      </header>
    ),
    summary: () => data.summary?.trim() ? (
      <section key="summary"><H>{t('summary', 'Summary')}</H><p className="text-[12px] leading-snug"><Html text={data.summary} /></p></section>
    ) : null,
    skills: () => {
      const rows = (data.skills || []).filter(s => s.value?.trim())
      if (!rows.length) return null
      return (
        <section key="skills"><H>{t('skills', 'Technical Skills')}</H>
          <div className="space-y-0.5 text-[12px] leading-snug">
            {rows.map((s, i) => <p key={i}>{s.label && <strong>{s.label}: </strong>}<Html text={s.value} /></p>)}
          </div>
        </section>
      )
    },
    experience: () => (data.experience || []).length ? (
      <section key="experience"><H>{t('experience', 'Experience')}</H>
        {data.experience.map((e, i) => (
          <div key={i} className="break-inside-avoid mb-2">
            <div className="flex justify-between gap-3 text-[12px]"><strong><Html text={e.role} /></strong><span className="whitespace-nowrap">{e.start} -- {e.end?.trim() ? e.end : 'Present'}</span></div>
            <div className="flex justify-between gap-3 text-[12px] italic"><span>
              {e.companyUrl ? <a href={e.companyUrl} target="_blank" rel="noreferrer">{e.company}</a> : <span>{e.company}</span>}
              {e.meta && <> | <Html text={e.meta} /></>}
            </span><span className="whitespace-nowrap">{e.location}</span></div>
            <Bullets items={e.bullets} />
          </div>
        ))}
      </section>
    ) : null,
    projects: () => (data.projects || []).length ? (
      <section key="projects"><H>{t('projects', 'Projects')}</H>
        {data.projects.map((p, i) => (
          <div key={i} className="break-inside-avoid mb-2">
            <div className="flex justify-between gap-3 text-[12px]"><span>
              {p.url ? <a className="font-bold" href={p.url} target="_blank" rel="noreferrer">{p.name}</a> : <strong>{p.name}</strong>}
              {p.tech && <> | <em><Html text={p.tech} /></em></>}
            </span><span className="whitespace-nowrap">{p.date}</span></div>
            <Bullets items={p.bullets} />
          </div>
        ))}
      </section>
    ) : null,
    education: () => (data.education || []).length ? (
      <section key="education"><H>{t('education', 'Education')}</H>
        {data.education.map((e, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex justify-between gap-3 text-[12px]"><strong><Html text={e.degree} /></strong><span className="whitespace-nowrap">{e.dates}</span></div>
            <div className="flex justify-between gap-3 text-[12px] italic"><span>{e.school}</span><span>{e.location}</span></div>
          </div>
        ))}
      </section>
    ) : null,
    achievements: () => {
      const items = (data.achievements || []).filter(a => a?.trim())
      if (!items.length) return null
      return (
        <section key="achievements"><H>{t('achievements', 'Achievements')}</H>
          <ul className="ml-5 list-none space-y-0.5 text-[12px] leading-snug">{items.map((a, i) => <li key={i}>• <Html text={a} /></li>)}</ul>
        </section>
      )
    },
  }

  // Fit to 1 page: the content is laid out 720/scale wide and scaled down, so its text fills the page width.
  const shrunk = scale < 1
  return (
    <div id="resume-print" className="relative mx-auto bg-white px-12 py-12 text-black shadow-lg"
      style={{ width: '816px', fontFamily: 'Charter, Georgia, "Times New Roman", serif', minHeight: fit ? 0 : '1056px' }}>
      <div style={shrunk ? { height: `${fitHeight}px`, overflow: 'hidden' } : undefined}>
        <div id="resume-content" style={shrunk
          ? { width: `${720 / scale}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }
          : { width: '720px' }}>
          {order.map(k => (blocks[k] ? <div key={k} className="break-inside-avoid">{blocks[k]()}</div> : null))}
      {(data.custom || []).filter(c => c.title?.trim()).map((c, i) => (
        <section key={`custom-${i}`} className="break-inside-avoid">
          <H>{c.title}</H>
          {c.text?.trim() && <p className="text-[12px] leading-snug"><Html text={c.text} /></p>}
          <Bullets items={c.bullets} />
        </section>
      ))}
        </div>
      </div>
      {/* Page guides on screen: one line per Letter page break. Hidden when fitting to one page, and when printing. */}
      {!fit && (
        <div className="no-print pointer-events-none absolute inset-x-0 bottom-0 top-12" aria-hidden="true"
          style={{ background: `repeating-linear-gradient(to bottom, transparent 0px, transparent ${PAGE_TEXT_HEIGHT - 2}px, rgba(239,68,68,0.7) ${PAGE_TEXT_HEIGHT - 2}px, rgba(239,68,68,0.7) ${PAGE_TEXT_HEIGHT}px)` }} />
      )}
    </div>
  )
}
