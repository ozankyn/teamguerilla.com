const express = require('express');
const router = express.Router();
const { Store } = require('../database/store');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const messages = new Store('messages');

// POST /api/contact — Public form submission
router.post('/', (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Ad, e-posta ve mesaj zorunludur.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
    }

    const newMessage = messages.create({
      id: uuidv4(),
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      company: (company || '').trim(),
      service: (service || '').trim(),
      message: message.trim(),
      read: false
    });

    if (process.env.SMTP_HOST) {
      sendEmailNotification(newMessage).catch(err => {
        console.error('Email notification failed:', err.message);
      });
    }

    res.status(201).json({ success: true, message: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Bir hata oluştu.' });
  }
});

// GET /api/contact — List messages (auth required)
router.get('/', authMiddleware, (req, res) => {
  const items = messages.getAll();
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

// GET /api/contact/unread-count — Unread count (auth required)
router.get('/unread-count', authMiddleware, (req, res) => {
  const items = messages.getAll();
  const unread = items.filter(m => !m.read).length;
  res.json({ unread });
});

// PUT /api/contact/:id/read — Mark as read (auth required)
router.put('/:id/read', authMiddleware, (req, res) => {
  const item = messages.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  const updated = messages.update(req.params.id, { read: true });
  res.json(updated);
});

// DELETE /api/contact/:id — Delete message (auth required)
router.delete('/:id', authMiddleware, (req, res) => {
  const item = messages.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  messages.delete(req.params.id);
  res.json({ success: true });
});

async function sendEmailNotification(msg) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || 'info@teamguerilla.com',
    subject: `Yeni İletişim Formu: ${msg.name}`,
    html: `<h2>Yeni İletişim Formu Mesajı</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Ad Soyad</td><td style="padding:8px;border:1px solid #ddd">${msg.name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">E-posta</td><td style="padding:8px;border:1px solid #ddd">${msg.email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Telefon</td><td style="padding:8px;border:1px solid #ddd">${msg.phone || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Şirket</td><td style="padding:8px;border:1px solid #ddd">${msg.company || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Hizmet</td><td style="padding:8px;border:1px solid #ddd">${msg.service || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mesaj</td><td style="padding:8px;border:1px solid #ddd">${msg.message}</td></tr>
      </table>`
  });
}

module.exports = router;
