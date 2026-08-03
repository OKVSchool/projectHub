const mongoose = require('mongoose')

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String },
  status: { type: String, enum: ['active', 'parked', 'promoted'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  promotedToProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Idea', ideaSchema)
