'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import EndeavorCard from '@/components/EndeavorCard'

export default function EndeavorList() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [endeavors, setEndeavors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    api.getEndeavors()
      .then(setEndeavors)
      .catch(err => setError(err.message))
  }, [user])

  if (loading) return <p>Loading...</p>
  if (!user) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Endeavors</h1>
        <button
          onClick={() => router.push('/endeavors/new')}
          style={{ background: '#e07820', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 6, fontWeight: 600 }}
        >
          + New Endeavor
        </button>
      </div>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {endeavors.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '4rem' }}>
          No endeavors yet. Start your first one!
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {endeavors.map(endeavor => (
            <EndeavorCard key={endeavor._id} endeavor={endeavor} />
          ))}
        </div>
      )}
    </div>
  )
}
