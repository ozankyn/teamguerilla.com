// ═══════════════════════════════════════════
// TG Admin — Main Application Logic
// ═══════════════════════════════════════════

// ─── AUTH CHECK ───
(function checkAuth() {
  if (!API.getToken()) {
    window.location.href = '/admin/login';
    return;
  }
  const user = API.getUser();
  if (user) {
    document.getElementById('userName').textContent = user.name || user.username;
    document.getElementById('userRole').textContent = user.role;
    if (user.role === 'admin') document.getElementById('usersNavItem').style.display = '';
  }
})();

// ─── STATE ───
let state = {
  services: [],
  references: [],
  team: [],
  users: [],
  content: {},
  currentContentTab: 'home',
  serviceFilter: 'all',
  refFilter: 'all',
};

// ─── SECTOR LABELS ───
const SECTOR_LABELS = {
  fmcg: 'FMCG', automotive: 'Otomotiv', technology: 'Teknoloji',
  retail: 'Perakende', finance: 'Finans', pharma: 'Kozmetik',
  energy: 'Enerji', other: 'Diğer'
};
const SERVICE_LABELS = {
  merchandising: 'Merchandising', 'sales-support': 'Satış Destek',
  'mystery-shopping': 'Gizli Müşteri', 'pop-posm': 'POP/POSM', software: 'Yazılım',
  sampling: 'Sampling', roadshow: 'Roadshow', guerilla: 'Gerilla',
  event: 'Etkinlik', mice: 'M.I.C.E.', neuro: 'Neuro Marketing', design: 'Tasarım'
};

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    navigateTo(section);
  });
});

function navigateTo(section) {
  // Update nav
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
  if (activeLink) activeLink.classList.add('active');
  // Update section
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sec-${section}`).classList.add('active');
  // Load data
  loadSection(section);
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ═══════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════
async function loadSection(section) {
  try {
    switch (section) {
      case 'dashboard': await loadDashboard(); break;
      case 'content': await loadContent(); break;
      case 'services': await loadServices(); break;
      case 'references': await loadReferences(); break;
      case 'team': await loadTeam(); break;
      case 'media': await loadMedia(); break;
      case 'messages': await loadMessages(); break;
      case 'users': await loadUsers(); break;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadDashboard() {
  const [services, refs, team] = await Promise.all([
    API.get('/services'), API.get('/references'), API.get('/team')
  ]);
  state.services = services;
  state.references = refs;
  state.team = team;
  document.getElementById('statServices').textContent = services.length;
  document.getElementById('statReferences').textContent = refs.length;
  document.getElementById('statTeam').textContent = team.length;
  try {
    const users = await API.get('/auth/users');
    state.users = users;
    document.getElementById('statUsers').textContent = users.length;
  } catch { document.getElementById('statUsers').textContent = '—'; }
}

// ═══════════════════════════════════════════
// CONTENT EDITOR
// ═══════════════════════════════════════════
async function loadContent() {
  state.content = await API.get('/content');
  renderContentEditor();
}

function switchContentTab(tab) {
  state.currentContentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderContentEditor();
}

function renderContentEditor() {
  const page = state.currentContentTab;
  const container = document.getElementById('contentEditor');
  const pageContent = {};

  // Group by section
  for (const [key, val] of Object.entries(state.content)) {
    if (key.startsWith(`${page}.`)) {
      const parts = key.replace(`${page}.`, '').split('.');
      const section = parts[0];
      if (!pageContent[section]) pageContent[section] = [];
      pageContent[section].push({ key, shortKey: parts.slice(1).join('.'), ...val });
    }
  }

  if (Object.keys(pageContent).length === 0) {
    container.innerHTML = '<div class="card"><p style="color:var(--text-muted)">Bu sayfa için henüz içerik eklenmemiş.</p></div>';
    return;
  }

  let html = '';
  for (const [section, fields] of Object.entries(pageContent)) {
    html += `<div class="content-group"><h4>${section}</h4>`;
    fields.forEach(f => {
      const lang = f.shortKey.endsWith('.tr') ? 'tr' : f.shortKey.endsWith('.en') ? 'en' : '';
      const langBadge = lang ? `<span class="lang-badge lang-${lang}">${lang}</span>` : '';
      const label = f.shortKey.replace(/\.(tr|en)$/, '').replace(/\./g, ' › ');
      const isImage = f.shortKey.includes('image');
      const isLong = (f.value || '').length > 80;
      let input;
      if (isImage) {
        input = `
          <div class="image-content-field">
            <div class="image-content-preview" id="preview_${f.key.replace(/\./g, '_')}">
              ${f.value ? `<img src="${f.value}" alt="Önizleme" style="max-width:100%;max-height:200px;border-radius:8px;margin-bottom:8px">` : '<span style="color:var(--text-muted)">Görsel yüklenmemiş</span>'}
            </div>
            <input type="text" data-key="${f.key}" value="${(f.value || '').replace(/"/g, '&quot;')}" placeholder="Görsel URL veya yükleyin" style="margin-bottom:8px">
            <button class="btn btn-sm" onclick="pickContentImage('${f.key}')">📷 Medya'dan Seç / Yükle</button>
          </div>`;
      } else if (isLong) {
        input = `<textarea data-key="${f.key}" rows="3">${f.value || ''}</textarea>`;
      } else {
        input = `<input type="text" data-key="${f.key}" value="${(f.value || '').replace(/"/g, '&quot;')}">`;
      }
      html += `<div class="content-field"><label>${langBadge} ${label}</label>${input}</div>`;
    });
    html += '</div>';
  }
  container.innerHTML = html;
}

async function saveContent() {
  const btn = document.getElementById('saveContentBtn');
  btn.disabled = true;
  btn.textContent = 'Kaydediliyor...';

  try {
    const entries = {};
    document.querySelectorAll('#contentEditor [data-key]').forEach(el => {
      entries[el.dataset.key] = { value: el.value };
    });
    await API.put('/content/bulk', entries);
    state.content = { ...state.content, ...Object.fromEntries(
      Object.entries(entries).map(([k, v]) => [k, { ...v, updatedAt: new Date().toISOString() }])
    )};
    showToast('İçerikler kaydedildi!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
  btn.disabled = false;
  btn.textContent = 'Değişiklikleri Kaydet';
}

// Content image picker
function pickContentImage(contentKey) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async function() {
    if (!this.files[0]) return;
    try {
      const result = await API.upload(this.files[0], 'homepage');
      if (result.url) {
        const field = document.querySelector(`[data-key="${contentKey}"]`);
        if (field) field.value = result.url;
        const previewId = 'preview_' + contentKey.replace(/\./g, '_');
        const preview = document.getElementById(previewId);
        if (preview) preview.innerHTML = `<img src="${result.url}" alt="Önizleme" style="max-width:100%;max-height:200px;border-radius:8px;margin-bottom:8px">`;
        showToast('Görsel yüklendi! Kaydetmeyi unutmayın.', 'success');
      }
    } catch (err) {
      showToast('Yükleme hatası: ' + err.message, 'error');
    }
  };
  input.click();
}

// ═══════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════
async function loadServices() {
  state.services = await API.get('/services');
  renderServices();
}

function filterServices(filter) {
  state.serviceFilter = filter;
  document.querySelectorAll('#sec-services .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === filter));
  renderServices();
}

function renderServices() {
  const list = state.serviceFilter === 'all'
    ? state.services
    : state.services.filter(s => s.department === state.serviceFilter);

  document.getElementById('servicesList').innerHTML = list.map(s => `
    <div class="item-card">
      <div class="card-header">
        <div>
          <div class="card-title">${s.name_tr}</div>
          <div class="card-subtitle">${s.name_en}</div>
        </div>
        <span class="dept-badge dept-${s.department}">${s.department}</span>
      </div>
      <div class="card-desc">${truncate(s.description_tr, 100)}</div>
      <div class="card-actions">
        <button class="btn btn-sm btn-outline" onclick="openServiceModal('${s.id}')">Düzenle</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('services', '${s.id}', '${s.name_tr}')">Sil</button>
      </div>
    </div>
  `).join('');
}

function openServiceModal(id) {
  const item = id ? state.services.find(s => s.id === id) : null;
  const title = item ? 'Hizmeti Düzenle' : 'Yeni Hizmet';
  const imgPreview = item?.image ? `<img src="${item.image}" style="max-height:80px;border-radius:6px;margin-top:8px;">` : '';

  openModal(title, `
    <div class="form-row">
      <div class="form-group">
        <label>Hizmet Adı (TR)</label>
        <input type="text" id="f_name_tr" value="${item?.name_tr || ''}">
      </div>
      <div class="form-group">
        <label>Service Name (EN)</label>
        <input type="text" id="f_name_en" value="${item?.name_en || ''}">
      </div>
    </div>
    <div class="form-group">
      <label>Açıklama (TR)</label>
      <textarea id="f_desc_tr" rows="3">${item?.description_tr || ''}</textarea>
    </div>
    <div class="form-group">
      <label>Description (EN)</label>
      <textarea id="f_desc_en" rows="3">${item?.description_en || ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Departman</label>
        <select id="f_department">
          <option value="retail" ${item?.department === 'retail' ? 'selected' : ''}>Retail</option>
          <option value="event" ${item?.department === 'event' ? 'selected' : ''}>Event</option>
        </select>
      </div>
      <div class="form-group">
        <label>İkon</label>
        <input type="text" id="f_icon" value="${item?.icon || ''}" placeholder="ör: grid, zap, globe">
      </div>
    </div>
    <div class="form-group">
      <label>Görsel</label>
      <input type="hidden" id="f_image" value="${item?.image || ''}">
      <button type="button" class="btn btn-sm btn-outline" onclick="pickServiceImage()">📷 Görsel Yükle</button>
      <div id="svc-img-preview">${imgPreview}</div>
    </div>
    <div class="form-group">
      <label>Sektörler (virgülle ayırın)</label>
      <input type="text" id="f_sectors" value="${(item?.sectors || []).join(', ')}" placeholder="ör: FMCG, Perakende, Teknoloji">
    </div>
    <label class="checkbox-label">
      <input type="checkbox" id="f_active" ${item?.active !== false ? 'checked' : ''}> Aktif
    </label>
  `, [
    { text: 'İptal', class: 'btn btn-outline', action: 'closeModal()' },
    { text: item ? 'Güncelle' : 'Oluştur', class: 'btn btn-primary', action: `saveService('${id || ''}')` },
  ]);
}

async function pickServiceImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async function() {
    if (!input.files[0]) return;
    try {
      const result = await API.upload(input.files[0], 'services');
      document.getElementById('f_image').value = result.url;
      document.getElementById('svc-img-preview').innerHTML = '<img src="' + result.url + '" style="max-height:80px;border-radius:6px;margin-top:8px;">';
      showToast('Görsel yüklendi', 'success');
    } catch(e) { showToast('Yükleme hatası', 'error'); }
  };
  input.click();
}

async function saveService(id) {
  const sectorsRaw = val('f_sectors');
  const sectors = sectorsRaw ? sectorsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const data = {
    name_tr: val('f_name_tr'), name_en: val('f_name_en'),
    description_tr: val('f_desc_tr'), description_en: val('f_desc_en'),
    department: val('f_department'), icon: val('f_icon'),
    image: val('f_image'), sectors: sectors,
    active: document.getElementById('f_active').checked,
  };
  try {
    if (id) { await API.put(`/services/${id}`, data); }
    else { await API.post('/services', data); }
    closeModal();
    await loadServices();
    showToast(id ? 'Hizmet güncellendi' : 'Hizmet oluşturuldu', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ═══════════════════════════════════════════
// REFERENCES
// ═══════════════════════════════════════════
async function loadReferences() {
  state.references = await API.get('/references');
  renderReferences();
}

function filterReferences(filter) {
  state.refFilter = filter;
  document.querySelectorAll('#sec-references .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === filter));
  renderReferences();
}

function renderReferences() {
  const list = state.refFilter === 'all'
    ? state.references
    : state.references.filter(r => r.sector === state.refFilter);

  document.getElementById('referencesList').innerHTML = list.map(r => `
    <div class="item-card ref-card">
      <div class="card-body">
        <div class="logo-area">
          ${r.logo ? `<img src="${r.logo}" alt="${r.brand}">` : r.brand.substring(0, 2)}
        </div>
        <div class="ref-content">
          <div class="card-title">${r.brand}</div>
          <div class="card-tags">
            <span class="tag tag-accent">${SECTOR_LABELS[r.sector] || r.sector}</span>
            ${(r.services || []).map(s => `<span class="tag">${SERVICE_LABELS[s] || s}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="card-actions" style="margin-top:12px">
        <button class="btn btn-sm btn-outline" onclick="openReferenceModal('${r.id}')">Düzenle</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('references', '${r.id}', '${r.brand}')">Sil</button>
      </div>
    </div>
  `).join('');
}

function openReferenceModal(id) {
  const item = id ? state.references.find(r => r.id === id) : null;
  const title = item ? 'Referansı Düzenle' : 'Yeni Referans';

  const sectorOptions = Object.entries(SECTOR_LABELS).map(([k, v]) =>
    `<option value="${k}" ${item?.sector === k ? 'selected' : ''}>${v}</option>`
  ).join('');

  const serviceCheckboxes = Object.entries(SERVICE_LABELS).map(([k, v]) =>
    `<label class="checkbox-label"><input type="checkbox" name="ref_services" value="${k}" ${(item?.services || []).includes(k) ? 'checked' : ''}> ${v}</label>`
  ).join('');

  openModal(title, `
    <div class="form-group">
      <label>Marka Adı</label>
      <input type="text" id="f_brand" value="${item?.brand || ''}">
    </div>
    <div class="form-group">
      <label>Sektör</label>
      <select id="f_sector">${sectorOptions}</select>
    </div>
    <div class="form-group">
      <label>Hizmet Türleri</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">${serviceCheckboxes}</div>
    </div>
    <div class="form-group">
      <label>Logo</label>
      <div class="image-picker ${item?.logo ? 'has-image' : ''}" onclick="this.querySelector('input').click()" id="refLogoPicker">
        ${item?.logo ? `<img src="${item.logo}" alt="Logo">` : '<span class="picker-text">Logo yüklemek için tıklayın</span>'}
        <input type="file" accept="image/*" onchange="handleImagePick(this, 'refLogoPicker', 'logos')">
      </div>
      <input type="hidden" id="f_logo" value="${item?.logo || ''}">
    </div>
    <label class="checkbox-label">
      <input type="checkbox" id="f_ref_active" ${item?.active !== false ? 'checked' : ''}> Aktif
    </label>
  `, [
    { text: 'İptal', class: 'btn btn-outline', action: 'closeModal()' },
    { text: item ? 'Güncelle' : 'Oluştur', class: 'btn btn-primary', action: `saveReference('${id || ''}')` },
  ]);
}

async function saveReference(id) {
  const services = [...document.querySelectorAll('input[name="ref_services"]:checked')].map(cb => cb.value);
  const data = {
    brand: val('f_brand'), sector: val('f_sector'), services,
    logo: val('f_logo'), active: document.getElementById('f_ref_active').checked,
  };
  try {
    if (id) { await API.put(`/references/${id}`, data); }
    else { await API.post('/references', data); }
    closeModal();
    await loadReferences();
    showToast(id ? 'Referans güncellendi' : 'Referans oluşturuldu', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ═══════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════
async function loadTeam() {
  state.team = await API.get('/team');
  renderTeam();
}

function renderTeam() {
  document.getElementById('teamList').innerHTML = state.team.map(t => `
    <div class="item-card team-card">
      <div class="photo-area">
        ${t.photo ? `<img src="${t.photo}" alt="${t.name}">` : '👤'}
      </div>
      <div class="card-title">${t.name}</div>
      <div class="card-subtitle">${t.title_tr}</div>
      <div class="card-subtitle" style="color:var(--text-dim)">${t.title_en}</div>
      <div class="card-actions" style="margin-top:12px">
        <button class="btn btn-sm btn-outline" onclick="openTeamModal('${t.id}')">Düzenle</button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem('team', '${t.id}', '${t.name}')">Sil</button>
      </div>
    </div>
  `).join('');
}

function openTeamModal(id) {
  const item = id ? state.team.find(t => t.id === id) : null;
  const title = item ? 'Üyeyi Düzenle' : 'Yeni Ekip Üyesi';

  openModal(title, `
    <div class="form-group">
      <label>Ad Soyad</label>
      <input type="text" id="f_name" value="${item?.name || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Ünvan (TR)</label>
        <input type="text" id="f_title_tr" value="${item?.title_tr || ''}">
      </div>
      <div class="form-group">
        <label>Title (EN)</label>
        <input type="text" id="f_title_en" value="${item?.title_en || ''}">
      </div>
    </div>
    <div class="form-group">
      <label>Fotoğraf</label>
      <div class="image-picker ${item?.photo ? 'has-image' : ''}" onclick="this.querySelector('input').click()" id="teamPhotoPicker">
        ${item?.photo ? `<img src="${item.photo}" alt="Fotoğraf">` : '<span class="picker-text">Fotoğraf yüklemek için tıklayın</span>'}
        <input type="file" accept="image/*" onchange="handleImagePick(this, 'teamPhotoPicker', 'team')">
      </div>
      <input type="hidden" id="f_photo" value="${item?.photo || ''}">
    </div>
    <label class="checkbox-label">
      <input type="checkbox" id="f_team_active" ${item?.active !== false ? 'checked' : ''}> Aktif
    </label>
  `, [
    { text: 'İptal', class: 'btn btn-outline', action: 'closeModal()' },
    { text: item ? 'Güncelle' : 'Oluştur', class: 'btn btn-primary', action: `saveTeamMember('${id || ''}')` },
  ]);
}

async function saveTeamMember(id) {
  const data = {
    name: val('f_name'), title_tr: val('f_title_tr'), title_en: val('f_title_en'),
    photo: val('f_photo'), active: document.getElementById('f_team_active').checked,
  };
  try {
    if (id) { await API.put(`/team/${id}`, data); }
    else { await API.post('/team', data); }
    closeModal();
    await loadTeam();
    showToast(id ? 'Üye güncellendi' : 'Üye oluşturuldu', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ═══════════════════════════════════════════
// MEDIA
// ═══════════════════════════════════════════
async function loadMedia() {
  try {
    const files = await API.get('/upload/list');
    renderMedia(files);
  } catch { renderMedia([]); }
}

function renderMedia(files) {
  if (files.length === 0) {
    document.getElementById('mediaGrid').innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1">Henüz yüklü görsel yok.</p>';
    return;
  }
  document.getElementById('mediaGrid').innerHTML = files.map(f => `
    <div class="media-item">
      <img src="${f.url}" alt="${f.name}" loading="lazy">
      <div class="media-actions">
        <span class="media-name">${f.name}</span>
        <button class="btn-icon" onclick="copyToClipboard('${f.url}')" title="URL kopyala">📋</button>
      </div>
    </div>
  `).join('');
}

async function uploadFiles(files) {
  for (const file of files) {
    try {
      showToast(`Yükleniyor: ${file.name}...`);
      await API.upload(file, 'general');
    } catch (err) {
      showToast(`Hata: ${file.name} — ${err.message}`, 'error');
    }
  }
  showToast('Yükleme tamamlandı!', 'success');
  loadMedia();
}

// Drag & drop
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
  ['dragenter', 'dragover'].forEach(e => uploadZone.addEventListener(e, (ev) => {
    ev.preventDefault(); uploadZone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(e => uploadZone.addEventListener(e, (ev) => {
    ev.preventDefault(); uploadZone.classList.remove('dragover');
  }));
  uploadZone.addEventListener('drop', (ev) => {
    const files = ev.dataTransfer.files;
    if (files.length) uploadFiles(files);
  });
}

// ═══════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════
async function loadUsers() {
  try {
    state.users = await API.get('/auth/users');
    renderUsers();
  } catch (err) {
    document.getElementById('usersList').innerHTML = '<p style="color:var(--text-muted)">Kullanıcı yönetimi için admin yetkisi gerekli.</p>';
  }
}

function renderUsers() {
  document.getElementById('usersList').innerHTML = state.users.map(u => `
    <div class="list-item">
      <div class="item-info">
        <div class="avatar">${(u.name || u.username).substring(0, 2).toUpperCase()}</div>
        <div>
          <div class="item-name">${u.name || u.username}</div>
          <div class="item-meta">${u.username} · ${u.role} · ${u.email || '—'}</div>
        </div>
      </div>
      <div>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', '${u.username}')">Sil</button>
      </div>
    </div>
  `).join('');
}

function openUserModal() {
  openModal('Yeni Kullanıcı', `
    <div class="form-group">
      <label>Ad</label>
      <input type="text" id="f_user_name" placeholder="Görünen ad">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Kullanıcı Adı</label>
        <input type="text" id="f_user_username">
      </div>
      <div class="form-group">
        <label>E-posta</label>
        <input type="email" id="f_user_email">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Şifre</label>
        <input type="password" id="f_user_password">
      </div>
      <div class="form-group">
        <label>Rol</label>
        <select id="f_user_role">
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  `, [
    { text: 'İptal', class: 'btn btn-outline', action: 'closeModal()' },
    { text: 'Oluştur', class: 'btn btn-primary', action: 'saveUser()' },
  ]);
}

async function saveUser() {
  const data = {
    name: val('f_user_name'), username: val('f_user_username'),
    email: val('f_user_email'), password: val('f_user_password'),
    role: val('f_user_role'),
  };
  try {
    await API.post('/auth/users', data);
    closeModal();
    await loadUsers();
    showToast('Kullanıcı oluşturuldu', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteUser(id, username) {
  if (!confirm(`"${username}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
  try {
    await API.del(`/auth/users/${id}`);
    await loadUsers();
    showToast('Kullanıcı silindi', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ═══════════════════════════════════════════
// GENERIC HELPERS
// ═══════════════════════════════════════════
async function deleteItem(type, id, name) {
  if (!confirm(`"${name}" öğesini silmek istediğinize emin misiniz?`)) return;
  try {
    await API.del(`/${type}/${id}`);
    showToast('Silindi', 'success');
    if (type === 'services') loadServices();
    if (type === 'references') loadReferences();
    if (type === 'team') loadTeam();
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleImagePick(input, pickerId, uploadType) {
  const file = input.files[0];
  if (!file) return;
  const picker = document.getElementById(pickerId);
  picker.innerHTML = '<span class="picker-text">Yükleniyor...</span><input type="file" accept="image/*" hidden>';

  try {
    const result = await API.upload(file, uploadType);
    picker.classList.add('has-image');
    picker.innerHTML = `<img src="${result.url}" alt="Yüklenen görsel"><input type="file" accept="image/*" onchange="handleImagePick(this, '${pickerId}', '${uploadType}')" hidden>`;
    // Set hidden field
    const hiddenField = pickerId === 'refLogoPicker' ? 'f_logo' : 'f_photo';
    document.getElementById(hiddenField).value = result.url;
  } catch (err) {
    showToast('Yükleme hatası: ' + err.message, 'error');
    picker.innerHTML = `<span class="picker-text">Tekrar deneyin</span><input type="file" accept="image/*" onchange="handleImagePick(this, '${pickerId}', '${uploadType}')" hidden>`;
  }
}

// ─── MODAL ───
function openModal(title, bodyHtml, footerButtons = []) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFooter').innerHTML = footerButtons.map(b =>
    `<button class="${b.class}" onclick="${b.action}">${b.text}</button>`
  ).join('');
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

// ─── TOAST ───
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── UTILS ───
function val(id) { return document.getElementById(id)?.value?.trim() || ''; }
function truncate(str, len) { return str?.length > len ? str.substring(0, len) + '...' : str || ''; }
function copyToClipboard(text) {
  navigator.clipboard.writeText(window.location.origin + text);
  showToast('URL kopyalandı!', 'success');
}
function logout() {
  localStorage.removeItem('tg_token');
  localStorage.removeItem('tg_user');
  window.location.href = '/admin/login';
}

// ─── ESC to close modal ───
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ═══════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════
async function loadMessages() {
  try {
    const msgs = await API.get('/contact');
    const list = document.getElementById('messagesList');
    const empty = document.getElementById('messagesEmpty');
    
    if (msgs.length === 0) {
      list.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    list.innerHTML = msgs.map(m => `
      <div class="card msg-card ${m.read ? '' : 'msg-unread'}" style="margin-bottom:12px;cursor:pointer" onclick="viewMessage('${m.id}')">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:16px">
          <div>
            <strong>${m.name}</strong> ${!m.read ? '<span style="background:#e53e3e;color:#fff;font-size:11px;padding:2px 8px;border-radius:12px;margin-left:8px">Yeni</span>' : ''}
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${m.email}${m.company ? ' — ' + m.company : ''}</div>
            <div style="font-size:14px;margin-top:8px">${truncate(m.message, 120)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:12px;color:var(--text-muted)">${new Date(m.createdAt).toLocaleDateString('tr-TR')}</div>
            <div style="font-size:12px;color:var(--text-muted)">${new Date(m.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</div>
            ${m.service ? '<div style="font-size:11px;background:var(--bg-secondary);padding:2px 8px;border-radius:4px;margin-top:4px">' + m.service + '</div>' : ''}
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    showToast('Mesajlar yüklenemedi: ' + err.message, 'error');
  }
}

async function viewMessage(id) {
  try {
    // Mark as read
    await API.put(`/contact/${id}/read`, {});
    // Reload
    await loadMessages();
    await loadUnreadCount();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadUnreadCount() {
  try {
    const data = await API.get('/contact/unread-count');
    const badge = document.getElementById('msgBadge');
    if (badge) {
      if (data.unread > 0) {
        badge.textContent = data.unread;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch { /* ignore */ }
}

// ─── INIT ───
loadDashboard();
loadUnreadCount();
