const admin = require('firebase-admin');

// 환경변수 검증 및 로깅
console.log('=== Firebase 환경변수 검증 시작 ===');
['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_DATABASE_URL'].forEach(key => {
    if (!process.env[key]) {
        console.error(`${key} is missing`);
        throw new Error(`${key} is missing`);
    }
    console.log(`${key} 확인됨:`, key === 'FIREBASE_PRIVATE_KEY' ? '[비공개]' : process.env[key]);
});

console.log('=== Firebase 초기화 시작 ===');
let db;

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const config = {
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        };
        
        console.log('초기화 설정:', {
            ...config,
            credential: '[비공개]'
        });

        admin.initializeApp(config);
        console.log('Firebase Admin SDK 초기화 성공');

        // 데이터베이스 연결 설정
        db = admin.database();
        console.log('Realtime Database 인스턴스 생성됨');

        // 연결 테스트
        db.ref('.info/connected').on('value', (snapshot) => {
            console.log('Database 연결 상태 변경:', snapshot.val() ? '연결됨' : '연결 끊김');
        });

    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        throw error;
    }
} else {
    console.log('Firebase가 이미 초기화되어 있음');
    db = admin.database();
}

// 데이터베이스 참조 생성
console.log('=== 데이터베이스 참조 생성 ===');
const usersRef = db.ref('users');
const tokensRef = db.ref('tokens');

// 초기 데이터 확인
Promise.all([
    usersRef.once('value'),
    tokensRef.once('value')
]).then(([usersSnapshot, tokensSnapshot]) => {
    console.log('현재 데이터 상태:');
    console.log('- users:', usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length + '개' : '없음');
    console.log('- tokens:', tokensSnapshot.exists() ? Object.keys(tokensSnapshot.val()).length + '개' : '없음');
}).catch(error => {
    console.error('데이터 확인 실패:', error);
});

// 실시간 모니터링 설정
usersRef.on('child_added', (snapshot) => {
    console.log('새 사용자 추가됨:', snapshot.key);
});

tokensRef.on('child_added', (snapshot) => {
    console.log('새 토큰 추가됨:', snapshot.key);
});

// 데이터베이스 연결 상태 확인
const checkConnection = async () => {
    try {
        const snapshot = await db.ref('.info/connected').once('value');
        const isConnected = snapshot.val() === true;
        console.log('Firebase 연결 상태:', isConnected ? '연결됨' : '연결 끊김');
        return isConnected;
    } catch (error) {
        console.error('Firebase 연결 확인 실패:', error);
        return false;
    }
};

// 연결 상태 모니터링
db.ref('.info/connected').on('value', (snapshot) => {
    console.log('Database 연결 상태 변경:', snapshot.val() ? '연결됨' : '연결 끊김');
});

// 초기 연결 확인
checkConnection().then(isConnected => {
    if (!isConnected) {
        console.error('초기 Firebase 연결 실패');
    }
});

module.exports = {
    admin,
    usersRef,
    tokensRef,
    checkConnection
}; 