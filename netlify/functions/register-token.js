const admin = require('firebase-admin');

// Firebase 초기화
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });
}

// 토큰 저장소 (실제로는 데이터베이스 사용 권장)
const tokens = new Map();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { token } = JSON.parse(event.body);
        const userId = `User_${Date.now()}`;
        tokens.set(userId, token);

        return {
            statusCode: 200,
            body: JSON.stringify({
                userId,
                message: '토큰이 등록되었습니다.'
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: '토큰 등록에 실패했습니다.'
            })
        };
    }
}; 