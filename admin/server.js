require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');
const contactRoutes = require('./routes/contact');
const { createCrudRouter } = require('./routes/crud');

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

// CRUD routes
app.use('/api/services', createCrudRouter('services'));
app.use('/api/references', createCrudRouter('references'));
app.use('/api/team', createCrudRouter('team'));

// ═══════════════════════════════════════════
// ADMIN PANEL ROUTE
// ═══════════════════════════════════════════
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ═══════════════════════════════════════════
// FRONTEND PAGES
// ═══════════════════════════════════════════
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');
app.use('/assets', express.static(path.join(FRONTEND_DIR, 'assets')));

const pages = {
  '/': 'index.html',
  '/hizmetler': 'hizmetler.html',
  '/referanslar': 'referanslar.html',
  '/biz-kimiz': 'biz-kimiz.html',
  '/iletisim': 'iletisim.html',
  // English routes
  '/en': 'index.html',
  '/en/services': 'hizmetler.html',
  '/en/references': 'referanslar.html',
  '/en/about': 'biz-kimiz.html',
  '/en/contact': 'iletisim.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, file));
  });
});

// ═══════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

// ═══════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// ═══════════════════════════════════════════
// START
// ═══════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Team Guerilla — Admin Panel            ║
║──────────────────────────────────────────║
║   🌐 http://localhost:${PORT}              ║
║   🔧 Admin: http://localhost:${PORT}/admin  ║
║   📡 API:   http://localhost:${PORT}/api    ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
