const mongoose = require('mongoose')

const traceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String },
  ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endeavor', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

module.exports = mongoose.model('Trace', traceSchema, 'thoughts')
