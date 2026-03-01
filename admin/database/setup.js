const { Store, ContentStore } = require('./store');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 Team Guerilla Admin Panel — Veritabanı kurulumu başlıyor...\n');

// ═══════════════════════════════════════════
// 1. USERS
// ═══════════════════════════════════════════
const users = new Store('users');
if (users.getAll().length === 0) {
  const salt = bcrypt.genSaltSync(10);
  users.create({
    id: uuidv4(),
    username: 'admin',
    email: 'info@teamguerilla.com',
    password: bcrypt.hashSync('TgAdmin2024!', salt),
    role: 'admin',
    name: 'Admin'
  });
  console.log('✅ Admin kullanıcı oluşturuldu (admin / TgAdmin2024!)');
} else {
  console.log('⏭️  Kullanıcılar zaten mevcut, atlanıyor.');
}

// ═══════════════════════════════════════════
// 2. PAGE CONTENT
// ═══════════════════════════════════════════
const content = new ContentStore();
const existingContent = content.getAll();

// Default content — only adds keys that don't exist yet
const defaultContent = {
    // --- HOMEPAGE ---
    'home.hero.title.tr': { value: 'Markanızı Sahaya Taşıyoruz' },
    'home.hero.title.en': { value: 'We Bring Your Brand to the Field' },
    'home.hero.subtitle.tr': { value: '20 yılı aşkın deneyim, 67 kişilik saha ekibi, Türkiye genelinde operasyon.' },
    'home.hero.subtitle.en': { value: 'Over 20 years of experience, 67 field team members, operations across Turkey.' },
    'home.hero.cta.tr': { value: 'Hemen İletişime Geçin' },
    'home.hero.cta.en': { value: 'Get in Touch' },

    // Homepage images
    'home.hero.image': { value: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80&fit=crop&auto=format' },
    'home.dept.retail.image': { value: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80&fit=crop&auto=format' },
    'home.dept.event.image': { value: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80&fit=crop&auto=format' },

    'home.stats.years.value': { value: '20+' },
    'home.stats.years.label.tr': { value: 'Yıllık Deneyim' },
    'home.stats.years.label.en': { value: 'Years of Experience' },
    'home.stats.team.value': { value: '67' },
    'home.stats.team.label.tr': { value: 'Saha Profesyoneli' },
    'home.stats.team.label.en': { value: 'Field Professionals' },
    'home.stats.cities.value': { value: '81' },
    'home.stats.cities.label.tr': { value: 'Şehir' },
    'home.stats.cities.label.en': { value: 'Cities' },
    'home.stats.brands.value': { value: '200+' },
    'home.stats.brands.label.tr': { value: 'Marka' },
    'home.stats.brands.label.en': { value: 'Brands' },

    // --- ABOUT ---
    'about.hero.title.tr': { value: '2004\'ten Bu Yana Sahada' },
    'about.hero.title.en': { value: 'In the Field Since 2004' },
    'about.hero.subtitle.tr': { value: 'Türkiye\'nin en köklü saha pazarlama ekiplerinden biriyiz.' },
    'about.hero.subtitle.en': { value: 'One of Turkey\'s most established field marketing teams.' },

    'about.story.tr': { value: '2004 yılında İstanbul\'da küçük bir ekiple yola çıktık. Bugün 67 kişilik profesyonel kadromuzla Türkiye\'nin 81 iline ulaşıyoruz. İki on yılı aşkın süredir büyük ve küçük markaların saha ihtiyaçlarını karşılıyor, her projeye ilk günkü heyecanla yaklaşıyoruz.' },
    'about.story.en': { value: 'We started in 2004 in Istanbul with a small team. Today, with our 67-member professional crew, we reach all 81 provinces of Turkey. For over two decades, we have been meeting the field needs of brands big and small, approaching every project with the same enthusiasm as day one.' },

    // --- CONTACT ---
    'contact.address.tr': { value: 'Caferağa Mah. Kadıköy, İstanbul, Türkiye' },
    'contact.address.en': { value: 'Caferağa Mah. Kadıköy, Istanbul, Turkey' },
    'contact.address.short.tr': { value: 'İstanbul, Kadıköy' },
    'contact.address.short.en': { value: 'Kadıköy, Istanbul' },
    'contact.phone': { value: '0216 410 39 99' },
    'contact.phone.raw': { value: '02164103999' },
    'contact.email': { value: 'info@teamguerilla.com' },
    'contact.map.query': { value: 'Team+Guerilla+Marketing+Kadıköy+İstanbul' },
    'contact.map.embed': { value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6506185942424!2d29.024!3d40.990!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab8679a5b0e51%3A0x4e5b7c6d7e8f9a0b!2sKad%C4%B1k%C3%B6y%2C%20Istanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str' },
};

// Merge: only add keys that don't exist yet
const newKeys = {};
let addedCount = 0;
for (const [key, val] of Object.entries(defaultContent)) {
  if (!existingContent[key]) {
    newKeys[key] = val;
    addedCount++;
  }
}

if (addedCount > 0) {
  content.setBulk(newKeys);
  console.log(`✅ Sayfa içerikleri güncellendi (${addedCount} yeni key eklendi)`);
} else {
  console.log('⏭️  Sayfa içerikleri güncel, ekleme yok.');
}

// ═══════════════════════════════════════════
// 3. SERVICES
// ═══════════════════════════════════════════
const services = new Store('services');
if (services.getAll().length === 0) {
  const serviceData = [
    // RETAIL
    { department: 'retail', name_tr: 'Merchandising', name_en: 'Merchandising', description_tr: 'Raf yönetimi, ürün yerleşim, stok takibi ve satış noktası denetimi ile markanızın raflardaki görünürlüğünü maksimuma çıkarıyoruz.', description_en: 'We maximize your brand\'s shelf visibility through shelf management, product placement, stock tracking and point-of-sale auditing.', icon: 'grid' },
    { department: 'retail', name_tr: 'Satış Destek', name_en: 'Sales Support', description_tr: 'Satış noktalarında aktif destek, müşteri yönlendirme ve satış artırıcı taktiklerle dönüşüm oranlarınızı yükseltiyoruz.', description_en: 'We boost your conversion rates with active in-store support, customer guidance and sales-driving tactics.', icon: 'trending-up' },
    { department: 'retail', name_tr: 'Gizli Müşteri', name_en: 'Mystery Shopping', description_tr: 'Eğitimli gizli müşterilerimizle satış noktalarındaki müşteri deneyimini objektif olarak ölçüyor ve raporluyoruz.', description_en: 'We objectively measure and report the customer experience at sales points with our trained mystery shoppers.', icon: 'eye' },
    { department: 'retail', name_tr: 'POP/POSM Lojistik', name_en: 'POP/POSM Logistics', description_tr: 'Satış noktası materyallerinin lojistiği, montajı ve bakımını uçtan uca yönetiyoruz.', description_en: 'We manage the logistics, installation and maintenance of point-of-sale materials end-to-end.', icon: 'package' },
    { department: 'retail', name_tr: 'Yazılım Çözümleri', name_en: 'Software Solutions', description_tr: 'Saha operasyonlarınız için özel geliştirdiğimiz yazılım ve raporlama çözümleriyle veriye dayalı kararlar almanızı sağlıyoruz.', description_en: 'We enable data-driven decisions with custom software and reporting solutions developed for your field operations.', icon: 'code' },
    // EVENT
    { department: 'event', name_tr: 'Sampling / Tadım', name_en: 'Sampling', description_tr: 'Mağaza içi ve sokak tadımları, ürün deneyimleme aktiviteleri ve tüketici geri bildirim toplama ile markanızı doğrudan tüketiciyle buluşturuyoruz.', description_en: 'We connect your brand directly with consumers through in-store and street sampling, product trials and consumer feedback collection.', icon: 'gift' },
    { department: 'event', name_tr: 'Roadshow', name_en: 'Roadshow', description_tr: 'Çok şehirli gezici etkinlikler, marka deneyim tırları ve lansman turları ile markanızı Türkiye\'nin dört bir yanına taşıyoruz.', description_en: 'We take your brand across Turkey with multi-city touring events, brand experience trucks and launch tours.', icon: 'map-pin' },
    { department: 'event', name_tr: 'Gerilla Pazarlama', name_en: 'Guerilla Marketing', description_tr: 'Yaratıcı sokak aktivasyonları, sürpriz etkinlikler ve viral kampanyalarla markanızı konuşulur hale getiriyoruz.', description_en: 'We make your brand the talk of the town with creative street activations, surprise events and viral campaigns.', icon: 'zap' },
    { department: 'event', name_tr: 'Etkinlik', name_en: 'Events', description_tr: 'Kurumsal etkinlikler, lansmanlar, açılışlar ve bayi toplantılarını profesyonel ekibimizle A\'dan Z\'ye planlıyor ve yönetiyoruz.', description_en: 'We plan and manage corporate events, launches, openings and dealer meetings from A to Z with our professional team.', icon: 'calendar' },
    { department: 'event', name_tr: 'M.I.C.E.', name_en: 'M.I.C.E.', description_tr: 'Toplantı, teşvik turizmi, konferans ve sergi organizasyonlarınızı uluslararası standartlarda gerçekleştiriyoruz.', description_en: 'We execute your meetings, incentive travel, conferences and exhibitions to international standards.', icon: 'globe' },
    { department: 'event', name_tr: 'Neuro Marketing', name_en: 'Neuro Marketing', description_tr: 'Nörobilim tabanlı tüketici davranış analizi ve pazarlama danışmanlığı ile kampanyalarınızın etkisini bilimsel olarak ölçüyoruz.', description_en: 'We scientifically measure your campaign impact with neuroscience-based consumer behavior analysis and marketing consultancy.', icon: 'brain' },
    { department: 'event', name_tr: 'Tasarım Atölyesi', name_en: 'Design Workshop', description_tr: 'Stand tasarımı, görsel tasarım ve marka materyalleri ile etkinliklerinize görsel kimlik kazandırıyoruz.', description_en: 'We give your events a visual identity with booth design, visual design and brand materials.', icon: 'palette' },
  ];

  serviceData.forEach((s, i) => {
    services.create({ id: uuidv4(), ...s, order: i, active: true });
  });
  console.log('✅ 12 hizmet oluşturuldu');
} else {
  console.log('⏭️  Hizmetler zaten mevcut, atlanıyor.');
}

// ═══════════════════════════════════════════
// 4. REFERENCES
// ═══════════════════════════════════════════
const references = new Store('references');
if (references.getAll().length === 0) {
  const refData = [
    { brand: 'Coca-Cola', sector: 'fmcg', services: ['sampling', 'merchandising', 'roadshow'] },
    { brand: 'PepsiCo', sector: 'fmcg', services: ['sampling', 'merchandising'] },
    { brand: 'Unilever', sector: 'fmcg', services: ['merchandising', 'sampling'] },
    { brand: 'P&G', sector: 'fmcg', services: ['merchandising', 'sales-support'] },
    { brand: 'Nestlé', sector: 'fmcg', services: ['sampling', 'roadshow'] },
    { brand: 'Mondelez', sector: 'fmcg', services: ['sampling', 'merchandising'] },
    { brand: 'Danone', sector: 'fmcg', services: ['sampling', 'merchandising'] },
    { brand: 'Ülker', sector: 'fmcg', services: ['merchandising', 'sampling', 'roadshow'] },
    { brand: 'Eti', sector: 'fmcg', services: ['sampling', 'roadshow'] },
    { brand: 'Toyota', sector: 'automotive', services: ['event', 'roadshow'] },
    { brand: 'Hyundai', sector: 'automotive', services: ['roadshow', 'event'] },
    { brand: 'Ford', sector: 'automotive', services: ['event', 'guerilla'] },
    { brand: 'Mercedes-Benz', sector: 'automotive', services: ['event', 'mice'] },
    { brand: 'BMW', sector: 'automotive', services: ['event', 'roadshow'] },
    { brand: 'Samsung', sector: 'technology', services: ['merchandising', 'sampling', 'roadshow'] },
    { brand: 'Apple', sector: 'technology', services: ['merchandising'] },
    { brand: 'Huawei', sector: 'technology', services: ['merchandising', 'roadshow'] },
    { brand: 'Xiaomi', sector: 'technology', services: ['merchandising', 'sampling'] },
    { brand: 'LG', sector: 'technology', services: ['merchandising', 'event'] },
    { brand: 'Vestel', sector: 'technology', services: ['merchandising', 'event'] },
    { brand: 'MediaMarkt', sector: 'retail', services: ['merchandising', 'event'] },
    { brand: 'Migros', sector: 'retail', services: ['merchandising', 'sampling'] },
    { brand: 'CarrefourSA', sector: 'retail', services: ['merchandising', 'sampling'] },
    { brand: 'Boyner', sector: 'retail', services: ['event', 'guerilla'] },
    { brand: 'LC Waikiki', sector: 'retail', services: ['event', 'roadshow'] },
    { brand: 'Garanti BBVA', sector: 'finance', services: ['event', 'mice'] },
    { brand: 'Akbank', sector: 'finance', services: ['event'] },
    { brand: 'İş Bankası', sector: 'finance', services: ['event', 'mice'] },
    { brand: 'Pfizer', sector: 'pharma', services: ['event', 'mice', 'neuro'] },
    { brand: 'Novartis', sector: 'pharma', services: ['event', 'mice'] },
    { brand: 'Roche', sector: 'pharma', services: ['mice', 'event'] },
    { brand: 'Bayer', sector: 'pharma', services: ['event', 'sampling'] },
    { brand: 'SOCAR', sector: 'energy', services: ['event', 'roadshow'] },
    { brand: 'Enerjisa', sector: 'energy', services: ['event', 'guerilla'] },
    { brand: 'Türk Telekom', sector: 'technology', services: ['roadshow', 'guerilla', 'event'] },
    { brand: 'Vodafone', sector: 'technology', services: ['roadshow', 'event', 'guerilla'] },
    { brand: 'Turkcell', sector: 'technology', services: ['roadshow', 'event', 'sampling'] },
    { brand: 'THY', sector: 'other', services: ['event', 'mice'] },
  ];

  refData.forEach((r, i) => {
    references.create({ id: uuidv4(), ...r, logo: null, order: i, active: true });
  });
  console.log('✅ 38 referans markası oluşturuldu');
} else {
  console.log('⏭️  Referanslar zaten mevcut, atlanıyor.');
}

// ═══════════════════════════════════════════
// 5. TEAM MEMBERS
// ═══════════════════════════════════════════
const team = new Store('team');
if (team.getAll().length === 0) {
  const teamData = [
    { name: 'Ahmet Yılmaz', title_tr: 'Genel Müdür', title_en: 'General Manager' },
    { name: 'Elif Demir', title_tr: 'Operasyon Direktörü', title_en: 'Operations Director' },
    { name: 'Mehmet Kaya', title_tr: 'Satış Müdürü', title_en: 'Sales Manager' },
    { name: 'Zeynep Arslan', title_tr: 'Kreatif Direktör', title_en: 'Creative Director' },
    { name: 'Can Öztürk', title_tr: 'Saha Koordinatörü', title_en: 'Field Coordinator' },
    { name: 'Selin Yıldız', title_tr: 'Müşteri İlişkileri Müdürü', title_en: 'Client Relations Manager' },
    { name: 'Burak Şahin', title_tr: 'Etkinlik Müdürü', title_en: 'Events Manager' },
    { name: 'Deniz Aydın', title_tr: 'Pazarlama Uzmanı', title_en: 'Marketing Specialist' },
  ];

  teamData.forEach((t, i) => {
    team.create({ id: uuidv4(), ...t, photo: null, order: i, active: true });
  });
  console.log('✅ 8 ekip üyesi oluşturuldu');
} else {
  console.log('⏭️  Ekip üyeleri zaten mevcut, atlanıyor.');
}

console.log('\n✨ Kurulum tamamlandı!');
console.log('   Admin girişi: admin / TgAdmin2024!');
console.log('   Sunucu başlatmak için: npm start\n');
