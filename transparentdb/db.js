const TransparentDB = {
  basePath: 'transparentdb/',

  async load(table) {
    const localKey = 'transparentdb_' + table;
    const local = localStorage.getItem(localKey);
    if (local) {
      try { return JSON.parse(local); } catch(e) {}
    }
    try {
      const res = await fetch(this.basePath + table + '.json?_=' + Date.now());
      if (!res.ok) throw new Error('Failed to load ' + table);
      const data = await res.json();
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    } catch (e) {
      console.warn('TransparentDB: Could not load ' + table, e);
      return null;
    }
  },

  async services() { return this.load('services'); },
  async products() { return this.load('products'); },
  async settings() { return this.load('settings'); },
  async hero() { return this.load('hero'); },
  async testimonials() { return this.load('testimonials'); },
  async features() { return this.load('features'); },
  async gallery() { return this.load('gallery'); },
  async contacts() { return this.load('contacts'); },

  async save(table, data) {
    try {
      localStorage.setItem('transparentdb_' + table, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('TransparentDB: Could not save ' + table, e);
      return false;
    }
  },

  async submitContact(formData) {
    const contacts = await this.contacts() || [];
    formData.id = Date.now();
    formData.date = new Date().toISOString();
    formData.read = false;
    contacts.push(formData);
    await this.save('contacts', contacts);

    try {
      await fetch('/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData)
      });
    } catch (e) {
      console.log('Contact saved locally (server offline)');
    }
    return true;
  }
};
