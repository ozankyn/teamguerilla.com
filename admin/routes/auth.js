const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Store } = require('../database/store');
const { authMiddleware, adminOnly, generateToken } = require('../middleware/auth');

const router = express.Router();
const users = new Store('users');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });

  const user = users.findOne('username', username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = users.getById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  const { password, ...safe } = user;
  res.json(safe);
});

// Change password
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = users.getById(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Mevcut şifre yanlış' });
  }

  const salt = bcrypt.genSaltSync(10);
  users.update(user.id, { password: bcrypt.hashSync(newPassword, salt) });
  res.json({ message: 'Şifre güncellendi' });
});

// List users (admin only)
router.get('/users', authMiddleware, adminOnly, (req, res) => {
  const allUsers = users.getAll().map(({ password, ...u }) => u);
  res.json(allUsers);
});

// Create user (admin only)
router.post('/users', authMiddleware, adminOnly, (req, res) => {
  const { username, email, password, role, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  if (users.findOne('username', username)) return res.status(400).json({ error: 'Bu kullanıcı adı zaten var' });

  const salt = bcrypt.genSaltSync(10);
  const user = users.create({
    id: uuidv4(), username, email: email || '',
    password: bcrypt.hashSync(password, salt),
    role: role || 'editor', name: name || username,
  });
  const { password: _, ...safe } = user;
  res.status(201).json(safe);
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, adminOnly, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
  const success = users.delete(req.params.id);
  if (!success) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  res.json({ message: 'Kullanıcı silindi' });
});

module.exports = router;
