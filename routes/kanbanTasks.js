const express = require('express');
const router = express.Router();
const KanbanTask = require('../models/KanbanTask');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  try {
    const { assigneeId } = req.query;
    const filter = {};

    if (assigneeId && assigneeId !== 'undefined' && assigneeId !== 'null' 
        && mongoose.Types.ObjectId.isValid(assigneeId)) {
      filter.assignees = assigneeId;
    }

    const tasks = await KanbanTask
      .find(filter)
      .populate('assignees', 'name email role');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };

    if (Array.isArray(payload.assignees)) {
      payload.assignees = payload.assignees.filter(
        id => id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id)
      );
    } else {
      payload.assignees = [];
    }

    const task = new KanbanTask(payload);
    await task.save();

    const saved = await KanbanTask.findById(task._id).populate('assignees', 'name email role');
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };

      if (Array.isArray(payload.assignees)) {
      payload.assignees = payload.assignees.filter(
        id => id && id !== 'undefined' && id !== 'null' && mongoose.Types.ObjectId.isValid(id)
      );
    } else {
      payload.assignees = [];
    }

    const task = await KanbanTask.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).populate('assignees', 'name email role');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await KanbanTask.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;