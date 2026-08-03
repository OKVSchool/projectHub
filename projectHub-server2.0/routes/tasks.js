const router = require('express').Router()
const Task = require('../models/Task')
const requireAuth = require('../middleware/requireAuth')

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const { projectId, ideaId, thoughtId } = req.query
    const filter = { userId: req.user._id }
    if (projectId) filter.projectId = projectId
    if (ideaId) filter.ideaId = ideaId
    if (thoughtId) filter.thoughtId = thoughtId
    const tasks = await Task.find(filter).sort({ createdAt: -1 })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user._id })
    res.status(201).json(task)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id })
    if (!task) return res.status(404).json({ error: 'Task not found' })
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!task) return res.status(404).json({ error: 'Task not found' })
    res.json(task)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!task) return res.status(404).json({ error: 'Task not found' })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
