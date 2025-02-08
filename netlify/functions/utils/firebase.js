const admin = require('firebase-admin');

// Firebase 초기화 로깅 추가
console.log('Firebase 초기화 시작...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
// private key는 보안상 로깅하지 않음

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
        console.log('Firebase 초기화 성공');
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        throw error;
    }
}

// 토큰 저장소 (임시)
const tokens = new Map();

module.exports = {
    admin,
    tokens
}; 