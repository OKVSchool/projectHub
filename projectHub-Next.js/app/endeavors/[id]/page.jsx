'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function EndeavorDetail() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [endeavor, setEndeavor] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user || id === 'new') return
    api.getEndeavor(id)
      .then(e => { setEndeavor(e); setForm(e) })
      .catch(err => setError(err.message))
  }, [user, id])

  async function handleSave() {
    try {
      const updated = await api.updateEndeavor(id, form)
      setEndeavor(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this endeavor?')) return
    try {
      await api.deleteEndeavor(id)
      router.push('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading || !endeavor) return <p>Loading…</p>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', color: '#e07820', marginBottom: '1.5rem', fontSize: '0.875rem' }}
      >
        ← Back to endeavors
      </button>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} aria-label="Endeavor title" style={inputStyle} placeholder="Title" />
          <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} aria-label="Endeavor description" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Description" />
          <input value={form.framework || ''} onChange={e => setForm(f => ({ ...f, framework: e.target.value }))} aria-label="Framework" style={inputStyle} placeholder="Framework" />
          <input value={form.repoUrl || ''} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))} aria-label="Repository URL" style={inputStyle} placeholder="Repo URL" />
          <input value={form.tags?.join(', ') || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))} aria-label="Tags, comma separated" style={inputStyle} placeholder="Tags (comma-separated)" />
          <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} aria-label="Endeavor status" style={inputStyle}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="deployed">Deployed</option>
          </select>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleSave} style={{ ...btnStyle, flex: 1 }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ ...btnStyle, background: '#2a2a2a', flex: 1 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{endeavor.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setEditing(true)} style={{ ...btnStyle, padding: '0.4rem 0.9rem', fontSize: '0.875rem' }}>Edit</button>
              <button onClick={handleDelete} style={{ ...btnStyle, background: '#dc2626', padding: '0.4rem 0.9rem', fontSize: '0.875rem' }}>Delete</button>
            </div>
          </div>
          {endeavor.description && <p style={{ color: '#aaa', lineHeight: 1.6, marginBottom: '1rem' }}>{endeavor.description}</p>}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#888' }}>
            {endeavor.framework && <span>Framework: <strong style={{ color: '#e5e5e5' }}>{endeavor.framework}</strong></span>}
            {endeavor.status && <span>Status: <strong style={{ color: '#e5e5e5' }}>{endeavor.status}</strong></span>}
            {endeavor.repoUrl && <a href={endeavor.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#e07820' }}>Repo ↗</a>}
          </div>
          {endeavor.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {endeavor.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.75rem', background: '#e0782022', color: '#e07820', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const inputStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e5e5e5',
  padding: '0.75rem 1rem',
  borderRadius: 6,
  fontSize: '1rem',
  width: '100%',
  outline: 'none'
}

const btnStyle = {
  background: '#e07820',
  color: '#fff',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer'
}
