require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const { db, admin } = require('./config/firebase');

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 제공을 위한 미들웨어 설정
app.use(express.static('public'));

// CORS 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Firebase 설정 제공
app.get('/api/firebase-config', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: "G-MEASUREMENT_ID"
    });
});

// VAPID 키 제공 엔드포인트
app.get('/api/vapid-key', (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(500).json({ error: 'VAPID key not configured' });
    }
    res.json({ 
        vapidKey: process.env.VAPID_PUBLIC_KEY,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    });
});

// 푸시 메시지 발송 엔드포인트
app.post('/api/send-push', async (req, res) => {
    try {
        const { token, title, body, userId } = req.body;

        if (!token || !title || !body) {
            return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
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

        res.json({ success: true, messageId: response });
    } catch (error) {
        console.error('푸시 메시지 발송 실패:', error);
        res.status(500).json({ error: error.message });
    }
});

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // 필수 환경 변수 확인
    const requiredEnvVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID',
        'VAPID_PUBLIC_KEY',
        'VAPID_PRIVATE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        console.error('Missing required environment variables:', missingEnvVars.join(', '));
        process.exit(1);
    }

    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});