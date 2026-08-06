'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import TracePanel from './TracePanel'
import MarkList from './MarkList'

export default function EndeavorPanel({ endeavor, traces, onUpdateTraces, isActive = false }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [addingTrace, setAddingTrace] = useState(false)
  const [newTrace, setNewTrace] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setOpen(true)
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function addTrace(e) {
    e.preventDefault()
    if (!newTrace.trim()) return
    await api.createTrace({ title: newTrace, projectId: endeavor._id })
    setNewTrace('')
    setAddingTrace(false)
    onUpdateTraces()
  }

  return (
    <div ref={ref} style={{ background: '#1a1a1a', border: `1px solid ${highlighted ? '#e07820' : '#2a2a2a'}`, borderRadius: 8, transition: 'border-color 0.4s' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#555', fontSize: '0.75rem' }}>{open ? '▼' : '▶'}</span>
        <span style={{ flex: 1, fontWeight: 500 }}>{endeavor.title}</span>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>{endeavor.status}</span>
        <Link
          href={`/endeavors/${endeavor._id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '0.8rem', color: '#e07820' }}
        >
          View ↗
        </Link>
      </div>

      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {traces.length === 0
              ? <p style={{ color: '#555', fontSize: '0.875rem' }}>No traces linked to this endeavor.</p>
              : traces.map(t => <TracePanel key={t._id} trace={t} onDelete={onUpdateTraces} nested />)
            }
          </div>

          {addingTrace ? (
            <form onSubmit={addTrace} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input autoFocus value={newTrace} onChange={e => setNewTrace(e.target.value)} placeholder="New trace…" style={miniInput} />
              <button type="submit" style={miniBtn}>Add</button>
              <button type="button" onClick={() => setAddingTrace(false)} style={{ ...miniBtn, background: '#2a2a2a' }}>✕</button>
            </form>
          ) : (
            <button onClick={() => setAddingTrace(true)} style={{ ...miniBtn, marginTop: '0.75rem' }}>+ Trace</button>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <MarkList parentId={endeavor._id} parentType="projectId" />
          </div>
        </div>
      )}
    </div>
  )
}

const miniInput = { flex: 1, background: '#0f0f0f', border: '1px solid #333', color: '#e5e5e5', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.85rem' }
const miniBtn = { background: '#e07820', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer' }
