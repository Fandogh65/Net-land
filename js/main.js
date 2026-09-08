// ============================================
// main.js - کدهای اصلی نت لند
// ============================================

// ============================================
// ===== علاقه‌مندی‌ها =====
// ============================================
async function toggleFavorite(button) {
  const card = button.closest(".festival-card");
  if (!card) return;

  const festivalId = card.dataset.id;
  const isActive = button.classList.contains("active");
  const userId = Storage.getUserId();

  if (isActive) {
    Storage.removeFavorite(festivalId);
    button.classList.remove("active");
    showToast("از علاقه‌مندی‌ها حذف شد");

    if (navigator.onLine) {
      try {
        await db.collection("users").doc(userId).collection("favorites").doc(festivalId).delete();
      } catch(e) { /* خطا رو نادیده بگیر */ }
    } else {
      Sync.addToOfflineQueue('favorite', {
        userId: userId,
        festivalId: festivalId,
        action: 'remove'
      });
    }

  } else {
    Storage.addFavorite(festivalId);
    button.classList.add("active");
    showToast("به علاقه‌مندی‌ها اضافه شد ❤️");

    if (navigator.onLine) {
      try {
        await db.collection("users").doc(userId).collection("favorites").doc(festivalId).set({
          festivalId: festivalId,
          addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch(e) { /* خطا رو نادیده بگیر */ }
    } else {
      Sync.addToOfflineQueue('favorite', {
        userId: userId,
        festivalId: festivalId,
        action: 'add'
      });
    }
  }

  Storage.logActivity('favorite_toggle', {
    festivalId: festivalId,
    action: isActive ? 'remove' : 'add'
  });
}

// ============================================
// ===== بارگذاری علاقه‌مندی‌ها =====
// ============================================
function loadFavorites() {
  const favorites = Storage.getFavorites();
  document.querySelectorAll(".festival-card").forEach(function(card) {
    const id = card.dataset.id;
    const button = card.querySelector(".favorite-button");
    if (!button) return;
    if (favorites.includes(id)) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// ============================================
// ===== بارگذاری جشنواره‌ها =====
// ============================================
async function loadFestivals() {
  const festivals = await Sync.fetchFestivals();
  console.log('📋 جشنواره‌ها:', festivals);
  // اینجا می‌تونی لیست جشنواره‌ها رو رندر کنی
  return festivals;
}

// ============================================
// ===== ارسال پیام پشتیبانی =====
// ============================================
async function sendSupportMessage(message) {
  if (!message || message.trim() === '') {
    showToast('لطفاً پیام خود را بنویسید');
    return;
  }

  const userId = Storage.getUserId();
  const result = await Sync.sendSupportMessage(message, userId);

  if (result.offline) {
    showToast("💾 پیام شما ذخیره شد و به‌محض آنلاین شدن ارسال می‌شود");
  } else {
    showToast("✅ پیام شما ارسال شد");
  }

  Storage.logActivity('support_message', {
    message: message.substring(0, 50),
    offline: result.offline || false
  });

  return result;
}

// ============================================
// ===== دریافت پیام‌های پشتیبانی =====
// ============================================
async function loadSupportMessages() {
  const userId = Storage.getUserId();
  const messages = await Sync.getSupportMessages(userId);
  console.log('💬 پیام‌های پشتیبانی:', messages);
  return messages;
}

// ============================================
// ===== ثبت فعالیت =====
// ============================================
function logActivity(type, detail) {
  Storage.logActivity(type, detail);
  const userId = Storage.getUserId();
  Sync.logActivity(userId, type, detail);
}

// ============================================
// ===== پیام toast =====
// ============================================
function showToast(message) {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add("show");
  });

  setTimeout(function() {
    toast.classList.remove("show");
    setTimeout(function() {
      if (toast.parentNode) toast.remove();
    }, 250);
  }, 2000);
}

// ============================================
// ===== مقداردهی اولیه =====
// ============================================
document.addEventListener("DOMContentLoaded", function() {
  const userId = Storage.getUserId();
  console.log('👤 شناسه کاربر:', userId);

  loadFavorites();
  loadFestivals();

  if (navigator.onLine) {
    Sync.processOfflineQueue();
    Sync.syncFavorites(userId, Storage.getFavorites());
  }

  // اسلایدر خودکار
  const dots = document.querySelectorAll(".slider-dot");
  let currentDot = 0;
  if (dots.length > 1) {
    setInterval(function() {
      dots[currentDot].classList.remove("active");
      currentDot = (currentDot + 1) % dots.length;
      dots[currentDot].classList.add("active");
    }, 3500);
  }

  // ثبت فعالیت بازدید
  logActivity('page_view', { page: 'index' });

  console.log('🚀 نت لند با معماری هیبرید راه‌اندازی شد!');
  console.log('📊 وضعیت:', navigator.onLine ? '🟢 آنلاین' : '🔴 آفلاین');
});

// ============================================
// ===== در دسترس قرار دادن برای HTML =====
// ============================================
window.toggleFavorite = toggleFavorite;
window.sendSupportMessage = sendSupportMessage;
window.loadSupportMessages = loadSupportMessages;
window.logActivity = logActivity;
window.showToast = showToast;