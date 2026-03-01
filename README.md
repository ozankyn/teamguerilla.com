# Team Guerilla Marketing — Website

Kurumsal web sitesi + admin panel.

## Proje Yapısı

```
teamguerilla/
├── frontend/                # Public website (statik HTML)
│   ├── index.html           # Ana Sayfa
│   ├── hizmetler.html       # Hizmetlerimiz
│   ├── referanslar.html     # Referanslar
│   ├── biz-kimiz.html       # Biz Kimiz
│   ├── iletisim.html        # İletişim
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
│
├── admin/                   # Admin panel (Node.js backend)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── database/
│   │   ├── store.js         # JSON data store
│   │   └── setup.js         # Seed script
│   ├── middleware/
│   │   └── auth.js          # JWT auth
│   ├── routes/
│   │   ├── auth.js          # Login, kullanıcı yönetimi
│   │   ├── content.js       # Sayfa içerikleri API
│   │   ├── crud.js          # Generic CRUD factory
│   │   └── upload.js        # Görsel yükleme
│   ├── data/                # JSON veri dosyaları (otomatik)
│   ├── uploads/             # Yüklenen görseller
│   └── public/              # Admin panel arayüzü
│
└── .gitignore
```

## Kurulum

### 1. Repo'yu klonla

```bash
git clone https://github.com/KULLANICI/teamguerilla.git
cd teamguerilla
```

### 2. Admin panel kurulumu

```bash
cd admin
cp .env.example .env        # Ayar dosyasını oluştur
npm install                  # Bağımlılıkları kur
npm run setup                # Admin kullanıcı + örnek veri oluştur
npm start                    # Sunucu başlat → localhost:3000
```

### 3. Frontend'i görüntüle

Frontend statik HTML. Admin sunucusu çalışırken:
- Site: http://localhost:3000/site/
- Admin: http://localhost:3000/admin
- API: http://localhost:3000/api

Veya frontend klasörünü doğrudan tarayıcıda aç:
```bash
# macOS
open frontend/index.html

# Linux
xdg-open frontend/index.html

# Windows
start frontend/index.html
```

## Varsayılan Giriş

| Alan | Değer |
|------|-------|
| Kullanıcı | `admin` |
| Şifre | `TgAdmin2024!` |

⚠️ Production'da `.env` içindeki `JWT_SECRET`'ı değiştirin.

## Admin Panel Özellikleri

- **Sayfa İçerikleri** — Hero, başlıklar, açıklamalar (TR/EN)
- **Hizmetler** — 12 hizmet, Retail/Event departmanları
- **Referanslar** — Marka, sektör, logo yükleme
- **Ekip Üyeleri** — İsim, ünvan, fotoğraf yükleme
- **Medya Kütüphanesi** — Drag & drop görsel yükleme
- **Kullanıcı Yönetimi** — Admin/Editor rolleri

## API

GET endpointleri public, yazma işlemleri auth gerektirir.

```
GET  /api/services           # Tüm hizmetler
GET  /api/references         # Tüm referanslar
GET  /api/team               # Tüm ekip üyeleri
GET  /api/content            # Tüm sayfa içerikleri
GET  /api/content/page/home  # Belirli sayfa içeriği
GET  /api/health             # Sunucu durumu
```

## Deploy

### Seçenek A: VPS (DigitalOcean, Hetzner, vb.)

```bash
# Sunucuda
git clone <repo-url>
cd teamguerilla/admin
cp .env.example .env
nano .env                    # Secret ve port ayarla
npm install --production
npm run setup
# PM2 ile çalıştır
npx pm2 start server.js --name tg-admin
# Nginx reverse proxy ekle
```

### Seçenek B: Railway / Render

1. GitHub repo'yu bağla
2. Root directory: `admin`
3. Build command: `npm install && npm run setup`
4. Start command: `npm start`
5. Environment variables ekle

### Frontend Deploy

Frontend statik dosyalar — herhangi bir hosting'e atılabilir:
- Netlify, Vercel (frontend klasörünü deploy)
- Aynı sunucuda Nginx ile serve
- Admin sunucusu zaten `/site/` altında serve ediyor
