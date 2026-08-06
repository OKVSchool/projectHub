const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String },
  status: { type: String, enum: ['active', 'parked', 'promoted'], default: 'active' },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high'], default: 'none' },
  promotedToProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endeavor', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Lead', leadSchema, 'ideas')
