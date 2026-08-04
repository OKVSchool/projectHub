'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    description: 'Sends a completely fabricated JWT string. requireAuth should reject it before hitting any route logic.',
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
  {
    label: 'Attack 2 — Tampered token',
    description: 'Takes your real JWT and flips one character in the signature segment, then sends it. requireAuth calls jwt.verify() — a modified signature should fail immediately.',
    run: async () => {
      const token = getToken()
      if (!token) return { status: 'ERR', data: { error: 'Not logged in — no token in localStorage' } }
      const parts = token.split('.')
      const sig = parts[2]
      const tamperedSig = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a')
      const tampered = [parts[0], parts[1], tamperedSig].join('.')
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${tampered}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Attack 3 — Injection-style bad input',
    description: 'POSTs a title that is 150 characters long — 50 over the 100-char max. The validate middleware should reject it before any database write.',
    run: async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: 'A'.repeat(150), description: '<script>alert(1)</script>' })
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: "Attack 4 — Another user's data",
    description: "Sends a DELETE for an ObjectId that exists in the database but belongs to a different user. The ownership filter { _id, userId } should make it a miss — no deletion should occur.",
    run: async () => {
      const res = await fetch(`${BASE_URL}/projects/507f1f77bcf86cd799439011`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      return { status: res.status, data: await res.json() }
    }
  },
  {
    label: 'Attack 5 — Oversized upload',
    description: 'Constructs a 6 MB Blob (over the 5 MB multer limit) and posts it as an image. Multer should reject it before writing anything to disk.',
    run: async () => {
      const bigBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'image/jpeg' })
      const form = new FormData()
      form.append('image', bigBlob, 'oversized.jpg')
      const res = await fetch(`${BASE_URL}/projects/507f1f77bcf86cd799439011/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      })
      return { status: res.status, data: await res.json() }
    }
  },
]

export default function DevTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {LIVE_TESTS.map(test => (
        <LiveTest key={test.label} test={test} />
      ))}
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

