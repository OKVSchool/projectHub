'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function TaskList({ parentId, parentType }) {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.getTasks({ [parentType]: parentId }).then(setTasks)
  }, [parentId, parentType])

  async function addTask(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const task = await api.createTask({ title: newTitle, [parentType]: parentId })
      setTasks(prev => [task, ...prev])
      setNewTitle('')
      setAdding(false)
    } catch { /* ignore */ }
  }

  async function toggleDone(task) {
    const updated = await api.updateTask(task._id, { done: !task.done })
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))
  }

  async function deleteTask(id) {
    await api.deleteTask(id)
    setTasks(prev => prev.filter(t => t._id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tasks</h2>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ background: 'none', border: '1px solid #444', color: '#e5e5e5', padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.875rem' }}
        >
          + Add task
        </button>
      </div>

      {adding && (
        <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Task title"
            style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e5e5e5', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.875rem' }}
          />
          <button type="submit" style={{ background: '#e07820', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, fontWeight: 600 }}>
            Add
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <p style={{ color: '#555', fontSize: '0.875rem' }}>No tasks yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tasks.map(task => (
            <li key={task._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              padding: '0.6rem 0.9rem',
              borderRadius: 6
            }}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task)}
                style={{ accentColor: '#e07820', width: 16, height: 16 }}
              />
              <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#555' : '#e5e5e5', fontSize: '0.9rem' }}>
                {task.title}
              </span>
              <button onClick={() => deleteTask(task._id)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '1rem', cursor: 'pointer' }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
