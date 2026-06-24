const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');

// GET все папки
router.get('/', async (req, res) => {
  try {
    const folders = await Folder.find();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST создать папку
router.post('/', async (req, res) => {
  const { name, filesCount } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  try {
    const folder = new Folder({ name, filesCount });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE папку
router.delete('/:id', async (req, res) => {
  try {
    const folder = await Folder.findByIdAndDelete(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;