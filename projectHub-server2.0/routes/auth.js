const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
})

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    const user = await User.create({ email, password, name })
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    res.json({ token: signToken(user._id), user: userPayload(user) })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
