const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class Store {
  constructor(name) {
    this.file = path.join(DATA_DIR, `${name}.json`);
    this.name = name;
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, '[]', 'utf8');
    }
  }

  _read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch { return []; }
  }

  _write(data) {
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2), 'utf8');
  }

  getAll() {
    return this._read();
  }

  getById(id) {
    return this._read().find(item => item.id === id) || null;
  }

  getBy(key, value) {
    return this._read().filter(item => item[key] === value);
  }

  findOne(key, value) {
    return this._read().find(item => item[key] === value) || null;
  }

  create(item) {
    const data = this._read();
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.push(item);
    this._write(data);
    return item;
  }

  update(id, updates) {
    const data = this._read();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    this._write(data);
    return data[index];
  }

  delete(id) {
    const data = this._read();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;
    data.splice(index, 1);
    this._write(data);
    return true;
  }

  reorder(ids) {
    const data = this._read();
    const ordered = ids.map((id, i) => {
      const item = data.find(d => d.id === id);
      if (item) item.order = i;
      return item;
    }).filter(Boolean);
    // Add any items not in the ids array at the end
    const remaining = data.filter(d => !ids.includes(d.id));
    this._write([...ordered, ...remaining]);
    return this.getAll();
  }
}

// Key-value store for page content (different structure)
class ContentStore {
  constructor() {
    this.file = path.join(DATA_DIR, 'content.json');
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, '{}', 'utf8');
    }
  }

  _read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch { return {}; }
  }

  _write(data) {
    fs.writeFileSync(this.file, JSON.stringify(data, null, 2), 'utf8');
  }

  getAll() {
    return this._read();
  }

  getByPage(page) {
    const data = this._read();
    const result = {};
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith(`${page}.`)) {
        result[key.replace(`${page}.`, '')] = val;
      }
    }
    return result;
  }

  get(key) {
    return this._read()[key] || null;
  }

  set(key, value) {
    const data = this._read();
    data[key] = { ...value, updatedAt: new Date().toISOString() };
    this._write(data);
    return data[key];
  }

  setBulk(entries) {
    const data = this._read();
    for (const [key, value] of Object.entries(entries)) {
      data[key] = { ...value, updatedAt: new Date().toISOString() };
    }
    this._write(data);
    return data;
  }
}

module.exports = { Store, ContentStore };
