require('dotenv').config()
const express = require('express')
const path = require('path')
const admin = require('firebase-admin')
const cors = require('cors')

// Firebase 초기화
const serviceAccount = require('./firebase-key.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 토큰 저장소 (실제 구현시에는 데이터베이스 사용 권장)
const tokens = new Map();

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 등록된 모든 토큰 조회
app.get('/get-tokens', (req, res) => {
    const tokenList = Array.from(tokens.entries()).map(([id, token]) => ({
        id,
        token
    }));
    res.json(tokenList);
});

// FCM 토큰 등록
app.post('/register-token', async (req, res) => {
    try {
        const { token } = req.body;
        const userId = `User_${Date.now()}`;
        tokens.set(userId, token);
        console.log('새로운 사용자 등록:', userId);
        console.log('현재 등록된 사용자 수:', tokens.size);
        res.status(200).json({ userId, message: '토큰이 등록되었습니다.' });
    } catch (error) {
        console.error('토큰 등록 실패:', error);
        res.status(500).json({ error: '토큰 등록에 실패했습니다.' });
    }
})

// 푸시 메시지 전송
app.post('/send-push', async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('푸시 요청 수신. 대상:', userId);
        
        const token = tokens.get(userId);
        if (!token) {
            console.error('토큰을 찾을 수 없음:', userId);
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }

        const message = {
            notification: {
                title: '새로운 알림',
                body: '푸시 메시지가 도착했습니다!'
            },
            token: token
        };

        console.log('FCM 메시지 전송 중...');
        await admin.messaging().send(message);
        console.log('FCM 메시지 전송 완료');
        res.status(200).json({ message: '푸시 메시지가 전송되었습니다.' });
    } catch (error) {
        console.error('푸시 전송 실패:', error);
        res.status(500).json({ error: '푸시 전송에 실패했습니다.' });
    }
})

const PORT = process.env.PORT || 5000;  // 환경변수에서 포트를 가져오거나 5000 사용

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`)
})