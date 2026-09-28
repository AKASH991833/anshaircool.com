const TransparentDB = {
  basePath: 'transparentdb/',

  async load(table) {
    try {
      const res = await fetch(this.basePath + table + '.json', {cache:'no-store'});
      if (!res.ok) throw new Error('Could not load ' + table);
      return await res.json();
    } catch (e) { console.warn(e); return null; }
  },

  async services() { return this.load('services'); },
  async products() { return this.load('products'); },
  async settings() { return this.load('settings'); },
  async hero() { return this.load('hero'); },
  async testimonials() { return this.load('testimonials'); },
  async features() { return this.load('features'); },
  async gallery() { return this.load('gallery'); },
  async contacts() { return this.load('contacts'); },

  // Public content is read-only; editing requires a separately secured publisher.
};
