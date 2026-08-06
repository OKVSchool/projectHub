require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const ideaRoutes = require('./routes/ideas')
const thoughtRoutes = require('./routes/thoughts')
const taskRoutes = require('./routes/tasks')
const adminRoutes = require('./routes/admin')

const app = express()

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:3000').trim(),
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/auth', authRoutes)
app.use('/projects', projectRoutes)
app.use('/ideas', ideaRoutes)
app.use('/thoughts', thoughtRoutes)
app.use('/tasks', taskRoutes)
app.use('/admin', adminRoutes)

module.exports = app
