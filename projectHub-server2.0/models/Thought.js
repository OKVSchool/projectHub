const mongoose = require('mongoose')

const thoughtSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String },
  ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', default: null },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Thought', thoughtSchema)
