const mongoose = require('mongoose');

const kanbanTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  progress: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 5 },
  dueDate: { type: String, default: '' },
  status: { type: String, enum: ['not-started', 'in-progress', 'under-review', 'completed'], default: 'not-started' },
  avatars: { type: [String], default: [] }, // массив CSS-классов для аватарок
  comments: { type: Number, default: 0 },
  attachments: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('KanbanTask', kanbanTaskSchema);