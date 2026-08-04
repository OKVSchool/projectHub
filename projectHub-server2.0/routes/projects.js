const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const Project = require('../models/Project')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const { clientError } = require('../middleware/httpError')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
    }
  }
})

const projectRules = {
  title:       { required: true, minLength: 1, maxLength: 100 },
  description: { maxLength: 1000 },
  framework:   { maxLength: 50 },
  repoUrl:     { isUrl: true },
  status:      { enum: ['active', 'completed', 'paused', 'deployed'] },
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const projects = await Project.find(filter).sort({ createdAt: -1 })
    res.json(projects)
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', validate(projectRules), async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, userId: req.user._id })
    res.status(201).json(project)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
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
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', validate(projectRules, { requireAll: false }), async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    res.status(400).json({ error: clientError(err) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json({ message: 'Project deleted' })
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/:id/image', (req, res, next) => {
  upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, async (req, res) => {
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
  } catch {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
