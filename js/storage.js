// ============================================
// storage.js - مدیریت حافظه محلی گوشی
// ============================================

const Storage = {
  // ===== کلیدها =====
  KEYS: {
    FAVORITES: 'netland_favorites',
    SETTINGS: 'netland_settings',
    ACTIVITIES: 'netland_activities',
    FESTIVALS_CACHE: 'netland_festivals_cache',
    USER_ID: 'netland_user_id'
  },

  // ===== ذخیره‌سازی عمومی =====
  set: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.warn('Storage set error:', e);
      return false;
    }
  },

  get: function(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch(e) {
      console.warn('Storage get error:', e);
      return defaultValue;
    }
  },

  // ===== علاقه‌مندی‌ها =====
  getFavorites: function() {
    return this.get(this.KEYS.FAVORITES, []);
  },

  addFavorite: function(festivalId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(festivalId)) {
      favorites.push(festivalId);
      this.set(this.KEYS.FAVORITES, favorites);
    }
    return favorites;
  },

  removeFavorite: function(festivalId) {
    const favorites = this.getFavorites();
    const newFavorites = favorites.filter(id => id !== festivalId);
    this.set(this.KEYS.FAVORITES, newFavorites);
    return newFavorites;
  },

  isFavorite: function(festivalId) {
    return this.getFavorites().includes(festivalId);
  },

  // ===== تنظیمات کاربر =====
  getSettings: function() {
    return this.get(this.KEYS.SETTINGS, {
      theme: 'light',
      language: 'fa',
      notifications: true
    });
  },

  updateSettings: function(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.set(this.KEYS.SETTINGS, updated);
    return updated;
  },

  // ===== فعالیت‌های کاربر =====
  getActivities: function() {
    return this.get(this.KEYS.ACTIVITIES, []);
  },

  addActivity: function(type, data) {
    const activities = this.getActivities();
    activities.push({
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    });
    if (activities.length > 100) {
      activities.shift();
    }
    this.set(this.KEYS.ACTIVITIES, activities);
    return activities;
  },

  // ===== کش جشنواره‌ها =====
  getFestivalsCache: function() {
    return this.get(this.KEYS.FESTIVALS_CACHE, {
      data: [],
      lastUpdate: null
    });
  },

  updateFestivalsCache: function(festivals) {
    this.set(this.KEYS.FESTIVALS_CACHE, {
      data: festivals,
      lastUpdate: new Date().toISOString()
    });
  },

  // ===== شناسه کاربر =====
  getUserId: function() {
    let userId = this.get(this.KEYS.USER_ID, null);
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      this.set(this.KEYS.USER_ID, userId);
    }
    return userId;
  },

  // ===== ثبت فعالیت =====
  logActivity: function(type, detail) {
    const activities = this.getActivities();
    activities.push({
      type: type,
      detail: detail,
      time: new Date().toISOString()
    });
    if (activities.length > 200) activities.shift();
    this.set(this.KEYS.ACTIVITIES, activities);
  },

  // ===== ریست همه داده‌های محلی =====
  resetAll: function() {
    for (let key in this.KEYS) {
      localStorage.removeItem(this.KEYS[key]);
    }
    console.log('🗑️ همه داده‌های محلی پاک شدند');
  }
};

window.Storage = Storage;