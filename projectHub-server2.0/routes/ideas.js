const router = require('express').Router()
const Idea = require('../models/Idea')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')

const ideaRules = {
  title:       { required: true, minLength: 1, maxLength: 100 },
  description: { maxLength: 500 },
  category:    { maxLength: 50 },
  status:      { enum: ['active', 'parked', 'promoted'] },
  priority:    { enum: ['none', 'low', 'medium', 'high'] },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const ideas = await Idea.find(filter).sort({ createdAt: -1 })
    res.json(ideas)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', validate(ideaRules), async (req, res) => {
  try {
    const idea = await Idea.create({ ...req.body, userId: req.user._id })
    res.status(201).json(idea)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, userId: req.user._id })
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.json(idea)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', validate(ideaRules, { requireAll: false }), async (req, res) => {
  try {
    const idea = await Idea.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.json(idea)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const idea = await Idea.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!idea) return res.status(404).json({ error: 'Idea not found' })
    res.json({ message: 'Idea deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
