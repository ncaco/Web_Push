const admin = require('firebase-admin');

// 환경변수 검증
if (!process.env.FIREBASE_PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID is missing');
if (!process.env.FIREBASE_PRIVATE_KEY) throw new Error('FIREBASE_PRIVATE_KEY is missing');
if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error('FIREBASE_CLIENT_EMAIL is missing');

console.log('Firebase 초기화 시작...');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
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