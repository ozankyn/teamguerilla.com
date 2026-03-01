const express = require('express');
const { ContentStore } = require('../database/store');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const content = new ContentStore();

// Get all content
router.get('/', (req, res) => {
  res.json(content.getAll());
});

// Get content by page
router.get('/page/:page', (req, res) => {
  res.json(content.getByPage(req.params.page));
});

// Get single content key
router.get('/key/:key', (req, res) => {
  const val = content.get(req.params.key);
  if (!val) return res.status(404).json({ error: 'İçerik bulunamadı' });
  res.json(val);
});

// Update single content key (auth required)
router.put('/key/:key', authMiddleware, (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Değer gerekli' });
  const result = content.set(req.params.key, { value });
  res.json(result);
});

// Bulk update content (auth required)
router.put('/bulk', authMiddleware, (req, res) => {
  const entries = req.body;
  if (!entries || typeof entries !== 'object') return res.status(400).json({ error: 'Geçersiz veri' });
  const result = content.setBulk(entries);
  res.json(result);
});

module.exports = router;
