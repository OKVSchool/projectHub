const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  dueBy: { type: Date, default: null },
  done: { type: Boolean, default: false },
  category: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', default: null },
  thoughtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought', default: null }
}, { timestamps: true })

module.exports = mongoose.model('Task', taskSchema)
