const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const ideaRoutes = require('./routes/ideas')
const thoughtRoutes = require('./routes/thoughts')
const taskRoutes = require('./routes/tasks')

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

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
