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

// Получить список всех пользователей (только для админов)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Создать нового пользователя (только для админов)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const user = new User({ 
      email, 
      password, 
      name, 
      role: role || 'user' 
    });
    await user.save();
    
    res.status(201).json({ 
      id: user._id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Обновить пользователя (только для админов)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (password) user.password = password;

    await user.save();

    res.json({ 
      id: user._id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Удалить пользователя (только для админов)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.userId === id) {
      return res.status(400).json({ message: 'Вы не можете удалить свою учетную запись' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({ message: 'Пользователь успешно удален' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Сбросить пароль пользователя (только для админов)
router.post('/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Пароль успешно изменен' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;