const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getDatabase } = require('firebase/database');
const admin = require('firebase-admin');
require('dotenv').config();

// 클라이언트 SDK 설정
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Admin SDK 설정
const adminConfig = {
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const adminApp = admin.initializeApp(adminConfig);

// Firestore & Realtime Database 인스턴스 생성
const db = getFirestore(app);
const adminDb = admin.firestore(adminApp);
const rtdb = getDatabase(app);
const adminRtdb = admin.database(adminApp);

module.exports = { 
    db,
    adminDb,
    rtdb,
    adminRtdb,
    admin
}; 