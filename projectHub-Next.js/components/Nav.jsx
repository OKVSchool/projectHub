'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Nav() {
  const { user, logout } = useAuth()

  return (
    <nav style={{
      background: '#1a1a1a',
      borderBottom: '1px solid #2a2a2a',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e07820' }}>
        projectHub
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/">Projects</Link>
            <Link href="/ideas">Ideas</Link>
            <span style={{ color: '#888', fontSize: '0.875rem' }}>{user.name}</span>
            <button
              onClick={logout}
              style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.75rem', borderRadius: 4 }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
