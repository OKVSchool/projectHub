'use client'

import Link from 'next/link'

const STATUS_COLORS = {
  active: '#22c55e',
  completed: '#e07820',
  paused: '#f59e0b',
  deployed: '#3b82f6'
}

export default function ProjectCard({ project }) {
  return (
    <Link href={`/projects/${project._id}`}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: 'pointer'
      }}>
        {project.imageUrl && (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}${project.imageUrl}`}
            alt={project.title}
            style={{ width: '100%', height: 160, objectFit: 'cover' }}
          />
        )}
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{project.title}</h2>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: STATUS_COLORS[project.status] || '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {project.status}
            </span>
          </div>

          {project.description && (
            <p style={{ color: '#aaa', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              {project.description.length > 100 ? project.description.slice(0, 100) + '…' : project.description}
            </p>
          )}

          {project.framework && (
            <span style={{ fontSize: '0.75rem', background: '#2a2a2a', padding: '0.2rem 0.5rem', borderRadius: 4, color: '#aaa' }}>
              {project.framework}
            </span>
          )}

          {project.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
              {project.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.7rem', background: '#e0782022', color: '#e07820', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
