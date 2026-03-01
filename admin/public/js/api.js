// ═══════════════════════════════════════════
// TG Admin — API Client
// ═══════════════════════════════════════════

const API = {
  base: '/api',

  getToken() {
    return localStorage.getItem('tg_token');
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('tg_user')); } catch { return null; }
  },

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${this.base}${path}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('tg_token');
      localStorage.removeItem('tg_user');
      window.location.href = '/admin/login';
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');
    return data;
  },

  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body }); },
  put(path, body) { return this.request(path, { method: 'PUT', body }); },
  del(path) { return this.request(path, { method: 'DELETE' }); },

  async upload(file, type = 'general') {
    const fd = new FormData();
    fd.append('file', file);
    return this.request(`/upload?type=${type}`, { method: 'POST', body: fd });
  }
};
