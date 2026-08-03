const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ph_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  uploadProjectImage: (id, formData) => {
    const token = getToken()
    return fetch(`${BASE_URL}/projects/${id}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).then(r => r.json())
  },

  // Ideas
  getIdeas: () => request('/ideas'),
  getIdea: (id) => request(`/ideas/${id}`),
  createIdea: (body) => request('/ideas', { method: 'POST', body: JSON.stringify(body) }),
  updateIdea: (id, body) => request(`/ideas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteIdea: (id) => request(`/ideas/${id}`, { method: 'DELETE' }),

  // Thoughts
  getThoughts: () => request('/thoughts'),
  getThought: (id) => request(`/thoughts/${id}`),
  createThought: (body) => request('/thoughts', { method: 'POST', body: JSON.stringify(body) }),
  updateThought: (id, body) => request(`/thoughts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteThought: (id) => request(`/thoughts/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return request(`/tasks${params ? `?${params}` : ''}`)
  },
  createTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' })
}
