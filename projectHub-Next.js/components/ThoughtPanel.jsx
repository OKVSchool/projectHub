'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

export default function ThoughtPanel({ thought, onDelete, nested = false, isActive = false }) {
  const [editing, setEditing] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [title, setTitle] = useState(thought.title)
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return
    setHighlighted(true)
    const clearHighlight = setTimeout(() => setHighlighted(false), 1800)
    const scroll = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    return () => { clearTimeout(clearHighlight); clearTimeout(scroll) }
  }, [isActive])

  async function saveTitle() {
    await api.updateThought(thought._id, { title })
    setEditing(false)
  }

  async function deleteThought() {
    await api.deleteThought(thought._id)
    onDelete()
  }

  return (
    <div ref={ref} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: nested ? '#0f0f0f' : '#1a1a1a',
      border: `1px solid ${highlighted ? '#e07820' : nested ? '#222' : '#2a2a2a'}`,
      borderRadius: 6,
      padding: '0.6rem 0.9rem',
      transition: 'border-color 0.4s'
    }}>
      <span style={{ color: '#555', fontSize: '0.75rem' }}>💭</span>

      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => e.key === 'Enter' && saveTitle()}
          style={{ flex: 1, background: '#0f0f0f', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.875rem' }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd' }}>{thought.title}</span>
      )}

      <button onClick={() => setEditing(true)} style={iconBtn}>✏️</button>
      <button onClick={deleteThought} style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
    </div>
  )
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.2rem' }
