'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import ThoughtPanel from './ThoughtPanel'
import TaskList from './TaskList'

export default function IdeaPanel({ idea, thoughts, onUpdate, onUpdateThoughts }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(idea.title)
  const [newThought, setNewThought] = useState('')
  const [addingThought, setAddingThought] = useState(false)

  async function saveTitle() {
    await api.updateIdea(idea._id, { title })
    setEditing(false)
    onUpdate()
  }

  async function deleteIdea() {
    if (!confirm('Delete this idea?')) return
    await api.deleteIdea(idea._id)
    onUpdate()
  }

  async function addThought(e) {
    e.preventDefault()
    if (!newThought.trim()) return
    await api.createThought({ title: newThought, ideaId: idea._id })
    setNewThought('')
    setAddingThought(false)
    onUpdateThoughts()
  }

  const priorityColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: '#555', fontSize: '0.75rem' }}>{open ? '▼' : '▶'}</span>
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onClick={e => e.stopPropagation()}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.3rem 0.5rem', borderRadius: 4 }}
          />
        ) : (
          <span style={{ flex: 1, fontWeight: 500 }}>{idea.title}</span>
        )}
        {idea.priority && idea.priority !== 'none' && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: priorityColors[idea.priority], textTransform: 'uppercase' }}>
            {idea.priority}
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); setEditing(true) }} style={iconBtn}>✏️</button>
        <button onClick={e => { e.stopPropagation(); deleteIdea() }} style={iconBtn}>🗑</button>
      </div>

      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {thoughts.map(t => <ThoughtPanel key={t._id} thought={t} onDelete={onUpdateThoughts} nested />)}
          </div>

          {addingThought ? (
            <form onSubmit={addThought} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input autoFocus value={newThought} onChange={e => setNewThought(e.target.value)} placeholder="New thought…" style={{ flex: 1, ...miniInput }} />
              <button type="submit" style={miniBtn}>Add</button>
              <button type="button" onClick={() => setAddingThought(false)} style={{ ...miniBtn, background: '#2a2a2a' }}>✕</button>
            </form>
          ) : (
            <button onClick={() => setAddingThought(true)} style={{ ...miniBtn, marginTop: '0.75rem' }}>+ Thought</button>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <TaskList parentId={idea._id} parentType="ideaId" />
          </div>
        </div>
      )}
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.1rem 0.25rem' }
const miniInput = { background: '#0f0f0f', border: '1px solid #333', color: '#e5e5e5', padding: '0.4rem 0.6rem', borderRadius: 4, fontSize: '0.85rem' }
const miniBtn = { background: '#e07820', color: '#fff', border: 'none', padding: '0.4rem 0.7rem', borderRadius: 4, fontSize: '0.85rem', cursor: 'pointer' }
