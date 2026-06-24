require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const KanbanTask = require('./models/KanbanTask');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await createDefaultAdmin();
    await seedDatabase(); // <-- заполняем данными
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// --- Admin ---
async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({ email: adminEmail, password: adminPassword, name: 'Administrator', role: 'admin' });
    } else {
      admin.password = adminPassword;
      admin.markModified('password');
    }
    await admin.save();
    console.log(`✅ Администратор: ${adminEmail} / пароль: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Ошибка admin:', error);
  }
}

// --- Seed ---
async function seedDatabase() {
  try {

    const taskCount = await KanbanTask.countDocuments();
    if (taskCount === 0) {
      console.log('🌱 Seeding Kanban tasks...');
      const tasks = [
        // Not Started
        { title: 'Pillo Website and App', description: 'New Design', priority: 'low', progress: 0, total: 5, dueDate: 'March 30, 2025', status: 'not-started', avatars: ['bg-blue-500','bg-purple-500','bg-pink-500'], comments: 3, attachments: 7 },
        { title: 'Lambo Consultancy Website', description: 'New Homepage', priority: 'medium', progress: 0, total: 5, dueDate: 'March 30, 2025', status: 'not-started', avatars: ['bg-green-500','bg-orange-500','bg-red-500'], comments: 3, attachments: 7 },
        // In Progress
        { title: 'Orbino Farmacy Website', description: 'New Homepage', priority: 'high', progress: 1, total: 5, dueDate: 'March 29, 2025', status: 'in-progress', avatars: ['bg-blue-500','bg-purple-500','bg-yellow-500'], comments: 3, attachments: 7 },
        { title: 'Tarbo App and Website', description: 'New Project', priority: 'low', progress: 2, total: 5, dueDate: 'March 28, 2025', status: 'in-progress', avatars: ['bg-green-500','bg-blue-500','bg-purple-500'], comments: 3, attachments: 7 },
        // Under Review
        { title: 'Ebay Website Development', description: 'New E-commerce', priority: 'low', progress: 5, total: 5, dueDate: 'March 21, 2025', status: 'under-review', avatars: ['bg-teal-500','bg-cyan-500','bg-orange-500'], comments: 3, attachments: 7 },
        { title: 'Fillio Webapp Design', description: 'New webapp', priority: 'medium', progress: 3, total: 5, dueDate: 'March 20, 2025', status: 'under-review', avatars: ['bg-purple-500','bg-blue-500','bg-green-500'], comments: 3, attachments: 7 },
        // Completed
        { title: 'Update Design System', description: 'New Design', priority: 'medium', progress: 5, total: 5, dueDate: 'March 16, 2025', status: 'completed', avatars: ['bg-pink-500','bg-blue-500','bg-orange-500'], comments: 3, attachments: 7 },
        { title: 'Ai Travel App Design', description: 'App Design', priority: 'high', progress: 5, total: 5, dueDate: 'March 15, 2025', status: 'completed', avatars: ['bg-green-500','bg-blue-500','bg-purple-500'], comments: 3, attachments: 7 },
      ];
      await KanbanTask.insertMany(tasks);
      console.log('✅ Kanban tasks seeded');
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
}

// --- Аутентификация ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email и пароль обязательны' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Неверный email или пароль' });
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Успешный вход',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role || 'user' },
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Требуется авторизация' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Неверный или просроченный токен' });
  }
};

app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- Роуты ---
app.use('/api/kanban-tasks', require('./routes/kanbanTasks'));
// Оставляем старые /api/tasks для простых задач (если нужны)
app.use('/api/tasks', require('./routes/tasks'));