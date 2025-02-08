const admin = require('firebase-admin');
const serviceAccount = require('../../../firebase-key.json');

// 환경변수 검증 및 로깅
console.log('=== Firebase 환경변수 검증 시작 ===');
['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_DATABASE_URL'].forEach(key => {
    if (!process.env[key]) {
        console.error(`${key} is missing`);
        throw new Error(`${key} is missing`);
    }
});

// Firebase가 이미 초기화되었는지 확인
if (!admin.apps.length) {
    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
    });
}

const db = admin.database();
const usersRef = db.ref('users');
const tokensRef = db.ref('tokens');

module.exports = {
    admin,
    usersRef,
    tokensRef
}; 