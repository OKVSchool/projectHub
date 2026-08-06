const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}, 30000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

async function signup(overrides = {}) {
  const body = { name: 'Test User', email: 'test@example.com', password: 'password123', ...overrides }
  const res = await request(app).post('/auth/signup').send(body)
  return { token: res.body.token, res }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('Auth', () => {
  test('signup creates a user and returns a token', async () => {
    const { res } = await signup()
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('test@example.com')
  })

  test('signup rejects duplicate email with 400', async () => {
    await signup()
    const { res } = await signup()
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/already in use/)
  })

  test('signup rejects password shorter than 8 characters', async () => {
    const { res } = await signup({ password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/password/)
  })

  test('signup rejects missing email', async () => {
    const res = await request(app).post('/auth/signup').send({ name: 'Test', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/)
  })

  test('login returns a token with correct credentials', async () => {
    await signup()
    const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  test('login rejects wrong password with 401', async () => {
    await signup()
    const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  test('login rejects unknown email with 401', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'password123' })
    expect(res.status).toBe(401)
  })

  test('protected route rejects request with no token', async () => {
    const res = await request(app).get('/endeavors')
    expect(res.status).toBe(401)
  })

  test('protected route rejects tampered token', async () => {
    const res = await request(app)
      .get('/endeavors')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.dGFtcGVyZWQ.invalidsignature')
    expect(res.status).toBe(401)
  })
})

// ─── Endeavors CRUD ───────────────────────────────────────────────────────────

describe('Endeavors CRUD', () => {
  let token

  beforeEach(async () => {
    const { token: t } = await signup()
    token = t
  })

  test('creates an endeavor and returns 201', async () => {
    const res = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Endeavor' })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('My Endeavor')
    expect(res.body._id).toBeDefined()
  })

  test('lists the authenticated user\'s endeavors', async () => {
    await request(app).post('/endeavors').set('Authorization', `Bearer ${token}`).send({ title: 'Endeavor One' })
    await request(app).post('/endeavors').set('Authorization', `Bearer ${token}`).send({ title: 'Endeavor Two' })
    const res = await request(app).get('/endeavors').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  test('updates own endeavor', async () => {
    const create = await request(app).post('/endeavors').set('Authorization', `Bearer ${token}`).send({ title: 'Original' })
    const id = create.body._id
    const res = await request(app).put(`/endeavors/${id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Updated')
  })

  test('deletes own endeavor', async () => {
    const create = await request(app).post('/endeavors').set('Authorization', `Bearer ${token}`).send({ title: 'To Delete' })
    const id = create.body._id
    const res = await request(app).delete(`/endeavors/${id}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const check = await request(app).get(`/endeavors/${id}`).set('Authorization', `Bearer ${token}`)
    expect(check.status).toBe(404)
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Input validation', () => {
  let token

  beforeEach(async () => {
    const { token: t } = await signup()
    token = t
  })

  test('rejects endeavor with missing title', async () => {
    const res = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title here' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/title/)
  })

  test('rejects endeavor title over 100 characters', async () => {
    const res = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x'.repeat(101) })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/title/)
  })

  test('rejects endeavor with invalid repoUrl', async () => {
    const res = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid Title', repoUrl: 'not-a-url' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/repoUrl/)
  })

  test('rejects endeavor with invalid status enum', async () => {
    const res = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Valid Title', status: 'invalid-status' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/status/)
  })
})

// ─── Ownership enforcement ────────────────────────────────────────────────────

describe('Ownership enforcement', () => {
  let tokenA, tokenB, endeavorId

  beforeEach(async () => {
    const a = await signup({ email: 'user-a@example.com' })
    const b = await signup({ email: 'user-b@example.com' })
    tokenA = a.token
    tokenB = b.token
    const create = await request(app)
      .post('/endeavors')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'User A Endeavor' })
    endeavorId = create.body._id
  })

  test('user B gets 404 reading user A\'s endeavor', async () => {
    const res = await request(app).get(`/endeavors/${endeavorId}`).set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(404)
  })

  test('user B gets 404 updating user A\'s endeavor', async () => {
    const res = await request(app)
      .put(`/endeavors/${endeavorId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked' })
    expect(res.status).toBe(404)
  })

  test('user B gets 404 deleting user A\'s endeavor', async () => {
    const res = await request(app).delete(`/endeavors/${endeavorId}`).set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(404)
  })

  test('user B only sees their own endeavors in the list', async () => {
    await request(app).post('/endeavors').set('Authorization', `Bearer ${tokenB}`).send({ title: 'B\'s Endeavor' })
    const res = await request(app).get('/endeavors').set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('B\'s Endeavor')
  })
})

// ─── Admin role ───────────────────────────────────────────────────────────────

describe('Admin role gating', () => {
  test('regular user is refused GET /admin/users with 403', async () => {
    const { token } = await signup()
    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  test('admin user can access GET /admin/users', async () => {
    const User = require('../models/User')
    await User.create({ name: 'Admin', email: 'admin@example.com', password: 'adminpass1', role: 'admin' })
    const loginRes = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'adminpass1' })
    const adminToken = loginRes.body.token
    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  test('admin response does not include password fields', async () => {
    const User = require('../models/User')
    await User.create({ name: 'Admin', email: 'admin@example.com', password: 'adminpass1', role: 'admin' })
    const loginRes = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'adminpass1' })
    const adminToken = loginRes.body.token
    const res = await request(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.body.every(u => u.password === undefined)).toBe(true)
  })
})
