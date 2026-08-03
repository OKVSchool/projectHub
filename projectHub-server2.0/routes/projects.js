const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const Project = require('../models/Project')
const requireAuth = require('../middleware/requireAuth')

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const projects = await Project.find(filter).sort({ createdAt: -1 })
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, userId: req.user._id })
    res.status(201).json(project)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id }
    const project = await Project.findOne(filter)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json({ message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
    const imageUrl = `/uploads/${req.file.filename}`
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { imageUrl },
      { new: true }
    )
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
