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

    // 필수 환경 변수 확인
    const requiredEnvVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_DATABASE_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
        console.log('Firebase Admin 초기화 성공');
        console.log('Database URL:', `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`);
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
        const { userId, title, body, data } = JSON.parse(event.body);
        console.log('Received request:', { userId, title, body, data });

        if (!userId || !title || !body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '필수 파라미터가 누락되었습니다.' })
            };
        }

        // 사용자의 FCM 토큰 가져오기
        const tokenSnapshot = await admin.database().ref(`tokens/${userId}`).once('value');
        console.log('Token data:', tokenSnapshot.val());

        if (!tokenSnapshot.exists()) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: '사용자의 FCM 토큰이 없습니다.' })
            };
        }

        const tokenData = tokenSnapshot.val();
        if (!tokenData || !tokenData.token) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'FCM 토큰이 유효하지 않습니다.' })
            };
        }

        // 메시지 구성
        const message = {
            token: tokenData.token,
            notification: {
                title,
                body
            },
            data: data || {},
            webpush: {
                headers: {
                    Urgency: 'high'
                },
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
                    link: data?.url || '/'
                }
            }
        };

        console.log('Sending FCM message:', JSON.stringify(message, null, 2));

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
            body: JSON.stringify({ 
                error: error.message,
                details: error.stack,
                code: error.code
            })
        };
    }
}; 