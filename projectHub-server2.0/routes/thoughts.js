const router = require('express').Router()
const Thought = require('../models/Thought')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')

const thoughtRules = {
  title:    { required: true, minLength: 1, maxLength: 200 },
  category: { maxLength: 50 },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const thoughts = await Thought.find(filter).sort({ createdAt: -1 })
    res.json(thoughts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', validate(thoughtRules), async (req, res) => {
  try {
    const thought = await Thought.create({ ...req.body, userId: req.user._id })
    res.status(201).json(thought)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const thought = await Thought.findOne({ _id: req.params.id, userId: req.user._id })
    if (!thought) return res.status(404).json({ error: 'Thought not found' })
    res.json(thought)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', validate(thoughtRules, { requireAll: false }), async (req, res) => {
  try {
    const thought = await Thought.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!thought) return res.status(404).json({ error: 'Thought not found' })
    res.json(thought)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const thought = await Thought.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!thought) return res.status(404).json({ error: 'Thought not found' })
    res.json({ message: 'Thought deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
