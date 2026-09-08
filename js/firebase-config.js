// ============================================
// پیکربندی Firebase - پروژه نت لند
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCRGJBDltXtztH5090Y0wi3AAmDBnWy4vQ",
  authDomain: "net-land-web.firebaseapp.com",
  projectId: "net-land-web",
  storageBucket: "net-land-web.firebasestorage.app",
  messagingSenderId: "1061800383832",
  appId: "1:1061800383832:web:4c89c7403a3782c886012d"
};

// ===== مقداردهی اولیه =====
firebase.initializeApp(firebaseConfig);

// ===== تنظیمات ویژه برای اتصال در ایران =====
firebase.firestore().settings({
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

// ===== این خط خیلی مهمه! =====
const db = firebase.firestore();

console.log('🔥 Firebase متصل شد!');
console.log('📁 پروژه:', firebaseConfig.projectId);