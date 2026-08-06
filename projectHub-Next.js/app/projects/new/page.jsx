'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function NewProject() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    framework: '',
    repoUrl: '',
    tags: '',
    status: 'active'
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const project = await api.createProject({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
      router.push(`/projects/${project._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', color: '#e07820', marginBottom: '1.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>New Project</h1>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Project title *"
          aria-label="Project title"
          required
          style={inputStyle}
        />
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description"
          aria-label="Project description"
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
        />
        <input
          value={form.framework}
          onChange={e => setForm(f => ({ ...f, framework: e.target.value }))}
          placeholder="Framework (e.g. React, Next.js, Express)"
          aria-label="Framework"
          style={inputStyle}
        />
        <input
          value={form.repoUrl}
          onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))}
          placeholder="Repo URL"
          aria-label="Repository URL"
          style={inputStyle}
        />
        <input
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          placeholder="Tags (comma-separated)"
          aria-label="Tags, comma separated"
          style={inputStyle}
        />
        <select
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          aria-label="Project status"
          style={inputStyle}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
        <button type="submit" disabled={submitting} style={btnStyle}>
          {submitting ? 'Creating…' : 'Create Project'}
        </button>
      </form>
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
  padding: '0.75rem',
  borderRadius: 6,
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer'
}
