const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Store } = require('../database/store');
const { authMiddleware } = require('../middleware/auth');

function createCrudRouter(storeName, validateFn) {
  const router = express.Router();
  const store = new Store(storeName);

  // Get all (public)
  router.get('/', (req, res) => {
    let items = store.getAll();
    // Filter by query params
    if (req.query.sector) items = items.filter(i => i.sector === req.query.sector);
    if (req.query.department) items = items.filter(i => i.department === req.query.department);
    if (req.query.active !== undefined) items = items.filter(i => i.active === (req.query.active === 'true'));
    // Sort by order
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(items);
  });

  // Get one (public)
  router.get('/:id', (req, res) => {
    const item = store.getById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(item);
  });

  // Create (auth required)
  router.post('/', authMiddleware, (req, res) => {
    if (validateFn) {
      const error = validateFn(req.body);
      if (error) return res.status(400).json({ error });
    }
    const item = store.create({ id: uuidv4(), ...req.body });
    res.status(201).json(item);
  });

  // Update (auth required)
  router.put('/:id', authMiddleware, (req, res) => {
    const { id, createdAt, ...updates } = req.body; // prevent overwriting id/createdAt
    const item = store.update(req.params.id, updates);
    if (!item) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(item);
  });

  // Delete (auth required)
  router.delete('/:id', authMiddleware, (req, res) => {
    const success = store.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Bulunamadı' });
    res.json({ message: 'Silindi' });
  });

  // Reorder (auth required)
  router.put('/actions/reorder', authMiddleware, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array gerekli' });
    const items = store.reorder(ids);
    res.json(items);
  });

  return router;
}

module.exports = { createCrudRouter };
