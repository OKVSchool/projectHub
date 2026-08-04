'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import ProjectCard from './ProjectCard'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const STATUS_COLORS = { active: '#3b82f6', completed: '#e07820', paused: '#f59e0b', deployed: '#22c55e' }
const PRIORITY_COLORS = { none: '#555', low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

const MOCK_PROJECTS = {
  active:    { _id: 'dev-1', title: 'Active Project',    description: 'A project currently in progress.',  framework: 'Next.js',        status: 'active',    tags: ['react', 'node'], repoUrl: 'https://github.com', imageUrl: null },
  completed: { _id: 'dev-2', title: 'Completed Project', description: 'A project that has been finished.', framework: 'Express',        status: 'completed', tags: ['api'],           repoUrl: null,                 imageUrl: null },
  paused:    { _id: 'dev-3', title: 'Paused Project',    description: 'A project currently on hold.',      framework: 'React Native',   status: 'paused',    tags: ['mobile'],        repoUrl: null,                 imageUrl: null },
  deployed:  { _id: 'dev-4', title: 'Deployed Project',  description: 'A project live in production.',     framework: 'Vercel + Render', status: 'deployed',  tags: ['prod', 'live'],  repoUrl: 'https://github.com', imageUrl: null },
}

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ph_token')
}

const LIVE_TESTS = [
  {
    label: '400 — POST /projects with no title',
    description: 'Sends an empty body to a protected POST route. The validate middleware should reject it.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({})
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '401 — GET /projects with a fake token',
    description: 'Sends a request with an invalid JWT. requireAuth should reject it before hitting any route logic.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: { Authorization: 'Bearer this-is-not-a-valid-token' }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: '404 — GET /projects/[nonexistent id]',
    description: 'Requests a valid-format ObjectId that does not exist in the database.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/projects/000000000000000000000000`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Loading — GET /projects (live)',
    description: 'Fires the real getProjects call. Watch the button go into loading before the response arrives.',
    run: async () => {
      const data = await api.getProjects()
      return { status: 200, data }
    }
  },
]

export default function DevTab() {
  const [showEmpty, setShowEmpty] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* LIVE API TESTS */}
      <Section title="Live API Tests">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {LIVE_TESTS.map(test => (
            <LiveTest key={test.label} test={test} />
          ))}
        </div>
      </Section>

      {/* STATUS BADGES */}
      <Section title="Project Status Badges">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '0.5rem 1rem', borderRadius: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'uppercase' }}>{status}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* PRIORITY BADGES */}
      <Section title="Idea Priority Badges">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '0.5rem 1rem', borderRadius: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'uppercase' }}>
                {priority === 'none' ? '— priority' : priority}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* EMPTY STATES */}
      <Section title="Empty States">
        <Toggle active={showEmpty} onToggle={() => setShowEmpty(v => !v)} label="Show empty states" />
        {showEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {[
              'No projects yet.',
              'No ideas yet.',
              'No standalone thoughts yet.',
              'No tasks yet.',
              'No thoughts linked to this project.',
            ].map(msg => (
              <p key={msg} style={{ color: '#555', fontSize: '0.875rem', background: '#1a1a1a', padding: '0.6rem 1rem', borderRadius: 6 }}>{msg}</p>
            ))}
          </div>
        )}
      </Section>

      {/* PROJECT CARDS BY STATUS */}
      <Section title="Project Cards — All Statuses">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {Object.values(MOCK_PROJECTS).map(p => <ProjectCard key={p._id} project={p} />)}
        </div>
      </Section>

      {/* IDEA PRIORITY ROWS */}
      <Section title="Idea Priority Rows">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.keys(PRIORITY_COLORS).map(priority => (
            <div key={priority} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.9rem 1rem' }}>
              <span style={{ color: '#555', fontSize: '0.75rem' }}>▶</span>
              <span style={{ flex: 1, fontWeight: 500 }}>Mock Idea — {priority} priority</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: PRIORITY_COLORS[priority], textTransform: 'uppercase' }}>
                {priority === 'none' ? '— priority' : priority}
              </span>
              <span style={{ fontSize: '0.9rem', padding: '0.1rem 0.25rem' }}>✏️</span>
              <span style={{ fontSize: '0.9rem', padding: '0.1rem 0.25rem', color: '#ef4444' }}>🗑</span>
            </div>
          ))}
        </div>
      </Section>

      {/* THOUGHT ROW */}
      <Section title="Thought Row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f0f0f', border: '1px solid #222', borderRadius: 6, padding: '0.6rem 0.9rem' }}>
          <span style={{ color: '#555', fontSize: '0.75rem' }}>💭</span>
          <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd' }}>Mock thought — nested inside an idea or project</span>
          <span style={{ fontSize: '0.85rem', padding: '0.1rem 0.2rem' }}>✏️</span>
          <span style={{ fontSize: '0.85rem', padding: '0.1rem 0.2rem', color: '#ef4444' }}>🗑</span>
        </div>
      </Section>

      {/* TASK ROWS */}
      <Section title="Task Rows">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { title: 'Incomplete task', done: false },
            { title: 'Completed task', done: true },
          ].map(task => (
            <div key={task.title} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '0.6rem 0.9rem', borderRadius: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${task.done ? '#e07820' : '#444'}`, background: task.done ? '#e07820' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {task.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: '0.9rem', color: task.done ? '#555' : '#e5e5e5', textDecoration: task.done ? 'line-through' : 'none' }}>
                {task.title}
              </span>
              <span style={{ color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}>×</span>
            </div>
          ))}
        </div>
      </Section>

    </div>
  )
}

function LiveTest({ test }) {
  const [state, setState] = useState({ phase: 'idle', status: null, data: null })

  async function run() {
    setState({ phase: 'loading', status: null, data: null })
    try {
      const result = await test.run()
      setState({ phase: 'done', status: result.status, data: result.data })
    } catch (err) {
      setState({ phase: 'done', status: 'ERR', data: { error: err.message } })
    }
  }

  const statusColor = state.phase === 'loading'
    ? '#f59e0b'
    : state.status >= 200 && state.status < 300
      ? '#22c55e'
      : '#ef4444'

  return (
    <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: state.phase !== 'idle' ? '0.75rem' : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{test.label}</div>
          <div style={{ fontSize: '0.78rem', color: '#666' }}>{test.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          {state.phase !== 'idle' && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>
              {state.phase === 'loading' ? 'loading…' : `${state.status}`}
            </span>
          )}
          <button
            onClick={run}
            disabled={state.phase === 'loading'}
            style={{
              background: state.phase === 'loading' ? '#2a2a2a' : '#e07820',
              color: '#fff',
              border: 'none',
              padding: '0.4rem 0.9rem',
              borderRadius: 4,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: state.phase === 'loading' ? 'not-allowed' : 'pointer'
            }}
          >
            Run
          </button>
        </div>
      </div>
      {state.phase === 'done' && (
        <pre style={{
          background: '#0a0a0a',
          border: `1px solid ${statusColor}33`,
          borderRadius: 6,
          padding: '0.75rem',
          fontSize: '0.78rem',
          color: '#ccc',
          overflowX: 'auto',
          margin: 0
        }}>
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>{title}</h3>
      {children}
    </div>
  )
}

function Toggle({ active, onToggle, label }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: active ? '#e07820' : '#2a2a2a',
        color: '#fff',
        border: 'none',
        padding: '0.35rem 0.9rem',
        borderRadius: 4,
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: 600
      }}
    >
      {active ? `Hide ${label.replace('Show ', '')}` : label}
    </button>
  )
}
