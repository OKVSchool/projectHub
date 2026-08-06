'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import IdeaPanel from '@/components/IdeaPanel'
import ThoughtPanel from '@/components/ThoughtPanel'
import ProjectPanel from '@/components/ProjectPanel'

const TABS = ['thoughts', 'ideas', 'projects']

const TYPE_COLORS = {
  Project: '#3b82f6',
  Idea:    '#e07820',
  Thought: '#a78bfa',
  Task:    '#22c55e',
}

export default function ProjectIdeas() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('projects')
  const [ideas, setIdeas] = useState([])
  const [thoughts, setThoughts] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.getIdeas(),
      api.getThoughts(),
      api.getProjects(),
      api.getTasks(),
    ])
      .then(([ideas, thoughts, projects, tasks]) => {
        setIdeas(ideas)
        setThoughts(thoughts)
        setProjects(projects)
        setTasks(tasks)
      })
      .catch(err => setError(err.message))
  }, [user])

  const refreshIdeas = () => api.getIdeas().then(setIdeas)
  const refreshThoughts = () => api.getThoughts().then(setThoughts)

  function handleNavigate({ tab, activeId }) {
    setSearchQuery('')
    setTab(tab)
    setActiveId(activeId)
  }

  if (loading || !user) return <p>Loading…</p>

  const searching = searchQuery.trim().length > 0

  return (
    <div>
      <div className="ideas-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Ideas & Planning</h1>
        <div className="search-box">
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveId(null) }}
            placeholder="Search everything…"
            aria-label="Search projects, ideas, thoughts, and tasks"
            style={{
              width: '100%',
              background: '#1a1a1a',
              border: `1px solid ${searching ? '#e07820' : '#2a2a2a'}`,
              color: '#e5e5e5',
              padding: '0.5rem 2rem 0.5rem 0.85rem',
              borderRadius: 6,
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searching && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: '#f87171', background: '#1a1a1a', border: '1px solid #f871711a', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      {searching ? (
        <SearchResults
          query={searchQuery.trim()}
          projects={projects}
          ideas={ideas}
          thoughts={thoughts}
          tasks={tasks}
          onNavigate={handleNavigate}
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #2a2a2a' }}>
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

          {tab === 'thoughts' && <ThoughtsTab thoughts={thoughts} refresh={refreshThoughts} activeId={activeId} />}
          {tab === 'ideas' && <IdeasTab ideas={ideas} thoughts={thoughts} refresh={refreshIdeas} refreshThoughts={refreshThoughts} activeId={activeId} />}
          {tab === 'projects' && <ProjectsTab projects={projects} thoughts={thoughts} refreshThoughts={refreshThoughts} activeId={activeId} />}
        </>
      )}
    </div>
  )
}

function SearchResults({ query, projects, ideas, thoughts, tasks, onNavigate }) {
  const q = query.toLowerCase()

  const match = (...fields) => fields.some(f => typeof f === 'string' && f.toLowerCase().includes(q))

  const results = []

  projects.forEach(p => {
    if (match(p.title, p.description, p.framework, p.status, ...(p.tags || []))) {
      results.push({ type: 'Project', title: p.title, meta: [p.status, p.framework].filter(Boolean), context: null, navigateTo: { tab: 'projects', activeId: p._id } })
    }
  })

  ideas.forEach(idea => {
    if (match(idea.title, idea.description, idea.category, idea.status, idea.priority)) {
      results.push({ type: 'Idea', title: idea.title, meta: [idea.priority !== 'none' && idea.priority, idea.status].filter(Boolean), context: null, navigateTo: { tab: 'ideas', activeId: idea._id } })
    }
  })

  thoughts.forEach(t => {
    if (match(t.title, t.category)) {
      const parentProject = t.projectId ? projects.find(p => p._id === t.projectId) : null
      const parentIdea    = t.ideaId    ? ideas.find(i => i._id === t.ideaId)       : null
      const context = parentProject ? `in project: ${parentProject.title}`
        : parentIdea ? `in idea: ${parentIdea.title}`
        : 'standalone'
      const navigateTo = parentProject ? { tab: 'projects', activeId: parentProject._id }
        : parentIdea ? { tab: 'ideas', activeId: parentIdea._id }
        : { tab: 'thoughts', activeId: t._id }
      results.push({ type: 'Thought', title: t.title, meta: t.category ? [t.category] : [], context, navigateTo })
    }
  })

  tasks.forEach(task => {
    if (match(task.title, task.notes)) {
      const parentProject = task.projectId ? projects.find(p => p._id === task.projectId) : null
      const context = parentProject ? `in project: ${parentProject.title}` : null
      const navigateTo = parentProject ? { tab: 'projects', activeId: parentProject._id } : null
      results.push({ type: 'Task', title: task.title, meta: [task.done ? 'done' : 'open'], context, navigateTo })
    }
  })

  if (results.length === 0) {
    return <p style={{ color: '#888', marginTop: '2rem' }}>No results for &ldquo;{query}&rdquo;</p>
  }

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '1rem' }}>
        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo; — click to go there
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {results.map((r, i) => (
          <div
            key={i}
            onClick={() => r.navigateTo && onNavigate(r.navigateTo)}
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem', cursor: r.navigateTo ? 'pointer' : 'default' }}
            onMouseEnter={e => { if (r.navigateTo) e.currentTarget.style.borderColor = '#444' }}
            onMouseLeave={e => { if (r.navigateTo) e.currentTarget.style.borderColor = '#2a2a2a' }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: TYPE_COLORS[r.type], textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, minWidth: 48 }}>
              {r.type}
            </span>
            <span style={{ flex: 1, fontSize: '0.9rem', color: '#e5e5e5' }}>
              {highlight(r.title, query)}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
              {r.meta.map(m => (
                <span key={m} style={{ fontSize: '0.7rem', color: '#666', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4, padding: '0.1rem 0.4rem' }}>
                  {highlight(m, query)}
                </span>
              ))}
              {r.context && (
                <span style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                  {highlight(r.context, query)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function highlight(text, query) {
  if (!text || !query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#e0782033', color: '#e07820', borderRadius: 2, padding: 0 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function ThoughtsTab({ thoughts, refresh, activeId }) {
  const standalone = thoughts.filter(t => !t.ideaId && !t.projectId)
  return (
    <div>
      <AddThoughtForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {standalone.length === 0 ? (
          <p style={{ color: '#555' }}>No standalone thoughts yet.</p>
        ) : standalone.map(t => <ThoughtPanel key={t._id} thought={t} onDelete={refresh} isActive={activeId === t._id} />)}
      </div>
    </div>
  )
}

function IdeasTab({ ideas, thoughts, refresh, refreshThoughts, activeId }) {
  return (
    <div>
      <AddIdeaForm onAdd={refresh} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {ideas.length === 0 ? (
          <p style={{ color: '#555' }}>No ideas yet.</p>
        ) : ideas.map(idea => (
          <IdeaPanel key={idea._id} idea={idea} thoughts={thoughts.filter(t => t.ideaId === idea._id)} onUpdate={refresh} onUpdateThoughts={refreshThoughts} isActive={activeId === idea._id} />
        ))}
      </div>
    </div>
  )
}

function ProjectsTab({ projects, thoughts, refreshThoughts, activeId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {projects.length === 0 ? (
        <p style={{ color: '#555' }}>No projects yet.</p>
      ) : projects.map(p => (
        <ProjectPanel key={p._id} project={p} thoughts={thoughts.filter(t => t.projectId === p._id)} onUpdateThoughts={refreshThoughts} isActive={activeId === p._id} />
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
