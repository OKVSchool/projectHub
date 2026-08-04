'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import ThoughtPanel from './ThoughtPanel'
import TaskList from './TaskList'

export default function ProjectPanel({ project, thoughts, onUpdateThoughts, isActive = false }) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [addingThought, setAddingThought] = useState(false)
  const [newThought, setNewThought] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setOpen(true)
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function addThought(e) {
    e.preventDefault()
    if (!newThought.trim()) return
    await api.createThought({ title: newThought, projectId: project._id })
    setNewThought('')
    setAddingThought(false)
    onUpdateThoughts()
  }

  return (
    <div ref={ref} style={{ background: '#1a1a1a', border: `1px solid ${highlighted ? '#e07820' : '#2a2a2a'}`, borderRadius: 8, transition: 'border-color 0.4s' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#555', fontSize: '0.75rem' }}>{open ? '▼' : '▶'}</span>
        <span style={{ flex: 1, fontWeight: 500 }}>{project.title}</span>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>{project.status}</span>
        <Link
          href={`/projects/${project._id}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '0.8rem', color: '#e07820' }}
        >
          View ↗
        </Link>
      </div>

      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {thoughts.length === 0
              ? <p style={{ color: '#555', fontSize: '0.875rem' }}>No thoughts linked to this project.</p>
              : thoughts.map(t => <ThoughtPanel key={t._id} thought={t} onDelete={onUpdateThoughts} nested />)
            }
          </div>

          {addingThought ? (
            <form onSubmit={addThought} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input autoFocus value={newThought} onChange={e => setNewThought(e.target.value)} placeholder="New thought…" style={miniInput} />
              <button type="submit" style={miniBtn}>Add</button>
              <button type="button" onClick={() => setAddingThought(false)} style={{ ...miniBtn, background: '#2a2a2a' }}>✕</button>
            </form>
          ) : (
            <button onClick={() => setAddingThought(true)} style={{ ...miniBtn, marginTop: '0.75rem' }}>+ Thought</button>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <TaskList parentId={project._id} parentType="projectId" />
          </div>
        </div>
      )}
    </div>
  )
}

const miniInput = { flex: 1, background: '#0f0f0f', border: '1px solid #333', color: '#e5e5e5', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.85rem' }
const miniBtn = { background: '#e07820', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer' }
