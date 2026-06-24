const express = require('express');
const router = express.Router();
const KanbanTask = require('../models/KanbanTask');

// GET все задачи (можно фильтровать по статусу, но пока все)
router.get('/', async (req, res) => {
  try {
    const tasks = await KanbanTask.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST создать задачу
router.post('/', async (req, res) => {
  try {
    const task = new KanbanTask(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const task = await KanbanTask.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE задачу
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