// ============================================
// sync.js - همگام‌سازی با Firebase
// ============================================

const Sync = {
  // ===== صف آفلاین =====
  OFFLINE_QUEUE_KEY: 'netland_offline_queue',

  // ===== دریافت جشنواره‌ها =====
  fetchFestivals: async function() {
    try {
      if (!navigator.onLine) {
        console.log('📴 آفلاین هستیم، از کش استفاده میکنیم');
        return Storage.getFestivalsCache().data;
      }

      const snapshot = await db.collection('festivals')
        .orderBy('createdAt', 'desc')
        .get();

      const festivals = [];
      snapshot.forEach(doc => {
        festivals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      Storage.updateFestivalsCache(festivals);
      console.log('✅ جشنواره‌ها از Firebase دریافت شدند');
      return festivals;

    } catch(error) {
      console.warn('⚠️ خطا در دریافت جشنواره‌ها:', error);
      return Storage.getFestivalsCache().data;
    }
  },

  // ===== ارسال پیام پشتیبانی =====
  sendSupportMessage: async function(message, userId) {
    try {
      if (!navigator.onLine) {
        this.addToOfflineQueue('support', {
          message: message,
          userId: userId,
          timestamp: new Date().toISOString()
        });
        console.log('💾 پیام در صف آفلاین ذخیره شد');
        return { success: true, offline: true };
      }

      const docRef = await db.collection('support').add({
        userId: userId,
        message: message,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ پیام پشتیبانی ارسال شد:', docRef.id);
      return { success: true, id: docRef.id };

    } catch(error) {
      console.warn('⚠️ خطا در ارسال پیام:', error);
      this.addToOfflineQueue('support', {
        message: message,
        userId: userId,
        timestamp: new Date().toISOString()
      });
      return { success: false, offline: true };
    }
  },

  // ===== دریافت پیام‌های پشتیبانی =====
  getSupportMessages: async function(userId) {
    try {
      if (!navigator.onLine) {
        console.log('📴 آفلاین هستیم');
        return [];
      }

      const snapshot = await db.collection('support')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const messages = [];
      snapshot.forEach(doc => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return messages;

    } catch(error) {
      console.warn('⚠️ خطا در دریافت پیام‌ها:', error);
      return [];
    }
  },

  // ===== صف آفلاین =====
  addToOfflineQueue: function(type, data) {
    const queue = Storage.get(this.OFFLINE_QUEUE_KEY, []);
    queue.push({
      type: type,
      data: data,
      addedAt: new Date().toISOString()
    });
    Storage.set(this.OFFLINE_QUEUE_KEY, queue);
  },

  processOfflineQueue: async function() {
    const queue = Storage.get(this.OFFLINE_QUEUE_KEY, []);
    if (queue.length === 0 || !navigator.onLine) {
      console.log('📭 صف آفلاین خالی یا آفلاین هستیم');
      return;
    }

    console.log(`🔄 پردازش ${queue.length} آیتم در صف آفلاین...`);
    const remaining = [];

    for (const item of queue) {
      try {
        if (item.type === 'support') {
          await db.collection('support').add({
            ...item.data,
            syncedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('✅ آیتم آفلاین ارسال شد:', item);
        } else if (item.type === 'favorite') {
          const { userId, festivalId, action } = item.data;
          const ref = db.collection('users').doc(userId).collection('favorites').doc(festivalId);
          if (action === 'add') {
            await ref.set({ festivalId, addedAt: firebase.firestore.FieldValue.serverTimestamp() });
          } else if (action === 'remove') {
            await ref.delete();
          }
          console.log('✅ علاقه‌مندی آفلاین همگام شد:', festivalId);
        }
      } catch(error) {
        console.warn('⚠️ خطا در ارسال آیتم آفلاین:', error);
        remaining.push(item);
      }
    }

    Storage.set(this.OFFLINE_QUEUE_KEY, remaining);
    console.log(`📊 ${remaining.length} آیتم در صف باقی ماندند`);
  },

  // ===== همگام‌سازی علاقه‌مندی‌ها =====
  syncFavorites: async function(userId, localFavorites) {
    if (!navigator.onLine) return;

    try {
      const snapshot = await db.collection('users')
        .doc(userId)
        .collection('favorites')
        .get();

      const firebaseFavorites = [];
      snapshot.forEach(doc => firebaseFavorites.push(doc.id));

      const toAdd = localFavorites.filter(id => !firebaseFavorites.includes(id));
      const toRemove = firebaseFavorites.filter(id => !localFavorites.includes(id));

      for (const id of toAdd) {
        await db.collection('users').doc(userId).collection('favorites').doc(id).set({
          festivalId: id,
          addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      for (const id of toRemove) {
        await db.collection('users').doc(userId).collection('favorites').doc(id).delete();
      }

      if (toAdd.length > 0 || toRemove.length > 0) {
        console.log(`🔄 علاقه‌مندی‌ها همگام شدند: +${toAdd.length} -${toRemove.length}`);
      }

    } catch(error) {
      console.warn('⚠️ خطا در همگام‌سازی علاقه‌مندی‌ها:', error);
    }
  },

  // ===== ثبت فعالیت در Firebase =====
  logActivity: async function(userId, type, detail) {
    if (!navigator.onLine) return;

    try {
      await db.collection('users').doc(userId).collection('activities').add({
        type: type,
        detail: detail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(error) {
      console.warn('⚠️ خطا در ثبت فعالیت:', error);
    }
  }
};

window.addEventListener('online', function() {
  console.log('🌐 آنلاین شدیم! شروع همگام‌سازی...');
  Sync.processOfflineQueue();
  const userId = Storage.getUserId();
  Sync.syncFavorites(userId, Storage.getFavorites());
});

window.Sync = Sync;