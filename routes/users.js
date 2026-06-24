const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Требуются права admin' });
  next();
}

router.get('/', authenticate, async (req, res) => {
  try {
    // можно ограничить только админом:
    // if (req.user.role !== 'admin') return res.status(403)...
    const users = await User.find().select('_id name email role');
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const user = new User({ email, password, name, role: role || 'user' });
    await user.save();
    res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;