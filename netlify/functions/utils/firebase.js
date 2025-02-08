const admin = require('firebase-admin');

// 환경변수 검증 및 로깅
console.log('=== Firebase 환경변수 검증 시작 ===');
['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_DATABASE_URL'].forEach(key => {
    if (!process.env[key]) {
        console.error(`${key} is missing`);
        throw new Error(`${key} is missing`);
    }
});

let db;

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        db = admin.database();
        
        // 간단한 연결 테스트
        db.ref('.info/connected').once('value')
            .then(() => console.log('Firebase 연결 성공'))
            .catch(error => console.error('Firebase 연결 실패:', error));

    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        throw error;
    }
} else {
    db = admin.database();
}

const usersRef = db.ref('users');
const tokensRef = db.ref('tokens');

module.exports = {
    admin,
    usersRef,
    tokensRef
}; 