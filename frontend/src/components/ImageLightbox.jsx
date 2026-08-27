import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Full-screen image viewer.
 *
 * Scroll position is preserved by never touching the page's scroll containers:
 * the overlay is fixed, and wheel/touch events over it are swallowed rather than
 * the background being locked with `overflow: hidden` (which resets scroll on
 * close). Closing therefore leaves the reader exactly where it was.
 */
export default function ImageLightbox({ src, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const overlayRef = useRef(null)

  // Escape closes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setZoomed(z => !z) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Swallow scroll over the overlay so the page behind never moves.
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const block = (e) => e.preventDefault()
    el.addEventListener('wheel', block, { passive: false })
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('wheel', block)
      el.removeEventListener('touchmove', block)
    }
  }, [])

  // Reset the pan whenever we leave the zoomed state.
  useEffect(() => { if (!zoomed) setPan({ x: 0, y: 0 }) }, [zoomed])

  const onPointerDown = useCallback((e) => {
    if (!zoomed) return
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [zoomed, pan])

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y })
  }, [])

  const endDrag = useCallback(() => { dragRef.current = null }, [])

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain animate-[fadeIn_120ms_ease-out]"
    >
      {/* Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setZoomed(z => !z)}
          title={zoomed ? 'Fit to screen' : 'Zoom to full size'}
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {zoomed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
          )}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          title="Open the original in a new tab"
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
        </a>
        <button
          onClick={onClose}
          title="Close (Esc)"
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <img
        src={src}
        alt={alt || ''}
        draggable={false}
        onClick={(e) => { e.stopPropagation(); setZoomed(z => !z) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={zoomed ? { transform: `translate(${pan.x}px, ${pan.y}px)` } : undefined}
        className={
          zoomed
            ? 'max-w-none cursor-grab active:cursor-grabbing select-none'
            : 'max-w-full max-h-[88vh] object-contain cursor-zoom-in select-none rounded'
        }
      />

      <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/50 pointer-events-none">
        {zoomed ? 'Drag to pan · click to fit' : 'Click to zoom · Esc to close'}
      </p>
    </div>
  )
}
