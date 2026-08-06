const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('vw_token')
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

  // Endeavors
  getEndeavors: () => request('/endeavors'),
  getEndeavor: (id) => request(`/endeavors/${id}`),
  createEndeavor: (body) => request('/endeavors', { method: 'POST', body: JSON.stringify(body) }),
  updateEndeavor: (id, body) => request(`/endeavors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEndeavor: (id) => request(`/endeavors/${id}`, { method: 'DELETE' }),
  uploadEndeavorImage: (id, formData) => {
    const token = getToken()
    return fetch(`${BASE_URL}/endeavors/${id}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).then(r => r.json())
  },

  // Leads
  getLeads: () => request('/leads'),
  getLead: (id) => request(`/leads/${id}`),
  createLead: (body) => request('/leads', { method: 'POST', body: JSON.stringify(body) }),
  updateLead: (id, body) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  // Traces
  getTraces: () => request('/traces'),
  getTrace: (id) => request(`/traces/${id}`),
  createTrace: (body) => request('/traces', { method: 'POST', body: JSON.stringify(body) }),
  updateTrace: (id, body) => request(`/traces/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrace: (id) => request(`/traces/${id}`, { method: 'DELETE' }),

  // Marks
  getMarks: (query = {}) => {
    const params = new URLSearchParams(query).toString()
    return request(`/marks${params ? `?${params}` : ''}`)
  },
  createMark: (body) => request('/marks', { method: 'POST', body: JSON.stringify(body) }),
  updateMark: (id, body) => request(`/marks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMark: (id) => request(`/marks/${id}`, { method: 'DELETE' })
}
