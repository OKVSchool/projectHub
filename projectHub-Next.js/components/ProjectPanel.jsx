'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThoughtPanel from './ThoughtPanel'

export default function ProjectPanel({ project, thoughts }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
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

      {open && thoughts.length > 0 && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {thoughts.map(t => <ThoughtPanel key={t._id} thought={t} onDelete={() => {}} nested />)}
          </div>
        </div>
      )}
    </div>
  )
}
