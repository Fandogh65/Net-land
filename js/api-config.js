// ============================================
// api-config.js - اتصال به Cloudflare Worker
// ============================================

const API_BASE_URL = 'https://net-land-api.zz4591757.workers.dev';

async function getFestivals() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/festivals`);
    const data = await response.json();
    
    if (data.documents) {
      return data.documents.map(doc => {
        const fields = doc.fields || {};
        return {
          id: doc.name ? doc.name.split('/').pop() : '',
          title: fields.title?.stringValue || 'بدون عنوان',
          badge: fields.badge?.stringValue || 'ویژه',
          description: fields.description?.stringValue || '',
          type: fields.type?.stringValue || 'charge',
          icon: fields.icon?.stringValue || 'purple',
          status: fields.status?.stringValue || 'active',
          meta: fields.meta?.stringValue || fields.endDate?.stringValue || '',
          information: fields.information?.stringValue || '',
          link: fields.link?.stringValue || '#',
          createdAt: fields.createdAt?.timestampValue || null,
          endDate: fields.endDate?.stringValue || ''
        };
      });
    }
    return [];
  } catch (error) {
    console.error('❌ خطا در دریافت جشنواره‌ها:', error);
    return [];
  }
}

// ============================================
// دریافت جزئیات یک جشنواره با ID (برای festival-detail.html)
// ============================================
async function getFestivalById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/festival/${id}`);
    const data = await response.json();
    
    if (data.fields) {
      const fields = data.fields;
      return {
        id: data.name ? data.name.split('/').pop() : '',
        title: fields.title?.stringValue || 'بدون عنوان',
        badge: fields.badge?.stringValue || 'ویژه',
        description: fields.description?.stringValue || '',
        type: fields.type?.stringValue || 'charge',
        icon: fields.icon?.stringValue || 'purple',
        status: fields.status?.stringValue || 'active',
        meta: fields.meta?.stringValue || fields.endDate?.stringValue || '',
        information: fields.information?.stringValue || '',
        link: fields.link?.stringValue || '#',
        referralCode: fields.referralCode?.stringValue || '',
        image: fields.image?.stringValue || '',
        durationType: fields.durationType?.stringValue || '',
        endDate: fields.endDate?.stringValue || '',
        joinUrl: fields.joinUrl?.stringValue || fields.link?.stringValue || '',
        createdAt: fields.createdAt?.timestampValue || null
      };
    }
    return null;
  } catch (error) {
    console.error('❌ خطا در دریافت جزئیات جشنواره:', error);
    return null;
  }
}

// ============================================
// پشتیبانی (Support) - برای support.html و admin-support.html
// ============================================

async function getSupportMessages() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/support-messages`);
    const data = await response.json();
    
    console.log('📦 پاسخ Worker (support-messages):', data);
    
    if (data.documents) {
      return data.documents.map(doc => {
        const fields = doc.fields || {};
        return {
          id: doc.name ? doc.name.split('/').pop() : '',
          userId: fields.userId?.stringValue || '',
          username: fields.username?.stringValue || '',
          message: fields.message?.stringValue || '',
          isAdmin: fields.isAdmin?.booleanValue || false,
          reply: fields.reply?.stringValue || null,
          replyText: fields.replyText?.stringValue || null,
          repliedBy: fields.repliedBy?.stringValue || null,
          repliedAt: fields.repliedAt?.timestampValue || null,
          createdAt: fields.createdAt?.timestampValue || null
        };
      });
    }
    return [];
  } catch (error) {
    console.error('❌ خطا در دریافت پیام‌ها:', error);
    return [];
  }
}

// ============================================
// ارسال پیام پشتیبانی (با پشتیبانی از isAdmin)
// ============================================
async function sendSupportMessage(userId, username, message, isAdmin = false) {
  try {
    const payload = {
      userId,
      username: username || 'کاربر مهمان',
      message,
      isAdmin: isAdmin || false,
      repliedBy: isAdmin ? 'admin' : null,
      sender: isAdmin ? 'admin' : 'user',
      senderType: isAdmin ? 'admin' : 'user',
      role: isAdmin ? 'admin' : 'user'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('❌ خطا در ارسال پیام:', error);
    throw error;
  }
}

// ============================================
// دریافت پیام‌های یک کاربر با پاسخ‌های ادمین
// ============================================
async function getUserSupportMessages(userId) {
  try {
    const allMessages = await getSupportMessages();
    
    const userMessages = allMessages.filter(msg => {
      if (msg.userId === userId) return true;
      if (msg.isAdmin === true && msg.userId === userId) return true;
      if (msg.reply && msg.userId === userId) return true;
      return false;
    });
    
    return userMessages;
  } catch (error) {
    console.error('❌ خطا در دریافت پیام‌های کاربر:', error);
    return [];
  }
}

// ============================================
// دریافت همه پیام‌های پشتیبانی (برای پنل ادمین)
// ============================================
async function getAllSupportMessages() {
  try {
    return await getSupportMessages();
  } catch (error) {
    console.error('❌ خطا در getAllSupportMessages:', error);
    return [];
  }
}

// ============================================
// ارسال پاسخ ادمین به یک پیام خاص
// ============================================
async function sendAdminReply(userId, userName, message) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        username: userName || 'ادمین',
        message: message,
        isAdmin: true,
        repliedBy: 'admin',
        sender: 'admin',
        senderType: 'admin',
        role: 'admin'
      })
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'خطا در ارسال پاسخ');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ خطا در sendAdminReply:', error);
    throw error;
  }
}

// ============================================
// توابع کمکی
// ============================================

function getUserId() {
  let id = localStorage.getItem('netland_user_id');
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    localStorage.setItem('netland_user_id', id);
  }
  return id;
}

function getUserName() {
  let name = localStorage.getItem('netland_username');
  if (!name) {
    name = 'کاربر مهمان';
  }
  return name;
}