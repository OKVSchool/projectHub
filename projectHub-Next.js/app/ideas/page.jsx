'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import IdeaPanel from '@/components/IdeaPanel'
import ThoughtPanel from '@/components/ThoughtPanel'
import ProjectPanel from '@/components/ProjectPanel'

const TABS = ['thoughts', 'ideas', 'projects']

export default function ProjectIdeas() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('projects')
  const [ideas, setIdeas] = useState([])
  const [thoughts, setThoughts] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.getIdeas().then(setIdeas)
    api.getThoughts().then(setThoughts)
    api.getProjects().then(setProjects)
  }, [user])

  const refreshIdeas = () => api.getIdeas().then(setIdeas)
  const refreshThoughts = () => api.getThoughts().then(setThoughts)

  if (loading || !user) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ideas & Planning</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #2a2a2a', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              color: tab === t ? '#e07820' : '#888',
              fontWeight: tab === t ? 600 : 400,
              padding: '0.5rem 1rem',
              borderBottom: tab === t ? '2px solid #e07820' : '2px solid transparent',
              fontSize: '0.9rem',
              textTransform: 'capitalize',
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'thoughts' && (
        <ThoughtsTab thoughts={thoughts} refresh={refreshThoughts} />
      )}
      {tab === 'ideas' && (
        <IdeasTab ideas={ideas} thoughts={thoughts} refresh={refreshIdeas} refreshThoughts={refreshThoughts} />
      )}
      {tab === 'projects' && (
        <ProjectsTab projects={projects} thoughts={thoughts} refreshThoughts={refreshThoughts} />
      )}
    </div>
  )
}

function ThoughtsTab({ thoughts, refresh }) {
  const standalone = thoughts.filter(t => !t.ideaId && !t.projectId)

  return (
    <div>
      <AddThoughtForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {standalone.length === 0 ? (
          <p style={{ color: '#555' }}>No standalone thoughts yet.</p>
        ) : standalone.map(t => <ThoughtPanel key={t._id} thought={t} onDelete={refresh} />)}
      </div>
    </div>
  )
}

function IdeasTab({ ideas, thoughts, refresh, refreshThoughts }) {
  return (
    <div>
      <AddIdeaForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {ideas.length === 0 ? (
          <p style={{ color: '#555' }}>No ideas yet.</p>
        ) : ideas.map(idea => (
          <IdeaPanel key={idea._id} idea={idea} thoughts={thoughts.filter(t => t.ideaId === idea._id)} onUpdate={refresh} onUpdateThoughts={refreshThoughts} />
        ))}
      </div>
    </div>
  )
}

function ProjectsTab({ projects, thoughts, refreshThoughts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {projects.length === 0 ? (
        <p style={{ color: '#555' }}>No projects yet.</p>
      ) : projects.map(p => (
        <ProjectPanel key={p._id} project={p} thoughts={thoughts.filter(t => t.projectId === p._id)} onUpdateThoughts={refreshThoughts} />
      ))}
    </div>
  )
}

function AddThoughtForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await api.createThought({ title })
    setTitle('')
    setOpen(false)
    onAdd()
  }

  return open ? (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="New thought…" style={inputStyle} />
      <button type="submit" style={btnStyle}>Add</button>
      <button type="button" onClick={() => setOpen(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>Cancel</button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} style={btnStyle}>+ New Thought</button>
  )
}

function AddIdeaForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await api.createIdea({ title })
    setTitle('')
    setOpen(false)
    onAdd()
  }

  return open ? (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="New idea…" style={inputStyle} />
      <button type="submit" style={btnStyle}>Add</button>
      <button type="button" onClick={() => setOpen(false)} style={{ ...btnStyle, background: '#2a2a2a' }}>Cancel</button>
    </form>
  ) : (
    <button onClick={() => setOpen(true)} style={btnStyle}>+ New Idea</button>
  )
}

const inputStyle = {
  flex: 1,
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#e5e5e5',
  padding: '0.6rem 0.9rem',
  borderRadius: 6,
  fontSize: '0.9rem'
}

const btnStyle = {
  background: '#e07820',
  color: '#fff',
  border: 'none',
  padding: '0.6rem 1rem',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer'
}
