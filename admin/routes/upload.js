const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = req.query.type || 'general';
    const dir = path.join(UPLOAD_DIR, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı. Desteklenen: JPG, PNG, GIF, WebP, SVG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Upload single file
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya yüklenmedi' });

  const type = req.query.type || 'general';
  const url = `/uploads/${type}/${req.file.filename}`;
  res.json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// List uploaded files
router.get('/list', authMiddleware, (req, res) => {
  const type = req.query.type || '';
  const dir = type ? path.join(UPLOAD_DIR, type) : UPLOAD_DIR;

  if (!fs.existsSync(dir)) return res.json([]);

  const readDir = (dirPath, prefix = '') => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        files = files.concat(readDir(path.join(dirPath, entry.name), `${prefix}${entry.name}/`));
      } else {
        const stat = fs.statSync(path.join(dirPath, entry.name));
        files.push({
          name: entry.name,
          url: `/uploads/${prefix}${entry.name}`,
          size: stat.size,
          modified: stat.mtime,
        });
      }
    }
    return files;
  };

  res.json(readDir(dir, type ? `${type}/` : ''));
});

// Delete file
router.delete('/:type/:filename', authMiddleware, (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.type, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Dosya bulunamadı' });
  fs.unlinkSync(filePath);
  res.json({ message: 'Dosya silindi' });
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Dosya 5MB\'dan büyük olamaz' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
