const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
    // private key 처리
    let privateKey;
    try {
        privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // JSON 형식으로 저장된 경우 파싱
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = JSON.parse(privateKey);
        }
        // 개행 문자 처리
        privateKey = privateKey.replace(/\\n/g, '\n');
    } catch (error) {
        console.error('Private key 처리 중 오류:', error);
        throw new Error('Private key 형식이 올바르지 않습니다.');
    }

    if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY가 설정되지 않았습니다.');
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log('Firebase Admin 초기화 성공');
    } catch (error) {
        console.error('Firebase Admin 초기화 실패:', error);
        throw error;
    }
}

exports.handler = async function(event, context) {
    // CORS 헤더 설정
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    // POST 요청이 아닌 경우 처리
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { token, title, body, userId } = JSON.parse(event.body);

        if (!token || !title || !body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '필수 파라미터가 누락되었습니다.', data:event.body })
            };
        }

        // 메시지 구성
        const message = {
            notification: {
                title,
                body
            },
            token,
            webpush: {
                notification: {
                    icon: '/icon.png',
                    badge: '/icon.png',
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'open',
                            title: '열기'
                        },
                        {
                            action: 'close',
                            title: '닫기'
                        }
                    ]
                },
                fcmOptions: {
                    link: '/'
                }
            }
        };

        // FCM으로 메시지 발송
        const response = await admin.messaging().send(message);
        console.log('푸시 메시지 발송 성공:', response);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, messageId: response })
        };
    } catch (error) {
        console.error('푸시 메시지 발송 실패:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 