const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'paused', 'deployed'], default: 'active' },
  lanes: [{ type: String }],
  framework: { type: String },
  repoUrl: { type: String },
  tags: [{ type: String }],
  imageUrl: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Project', projectSchema)
