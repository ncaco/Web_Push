require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const { admin, usersRef, tokensRef } = require('./netlify/functions/utils/firebase')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 토큰 목록 조회
app.get('/get-tokens', async (req, res) => {
    try {
        const [usersSnapshot, tokensSnapshot] = await Promise.all([
            usersRef.once('value'),
            tokensRef.once('value')
        ]);
        
        const users = usersSnapshot.val() || {};
        const tokens = tokensSnapshot.val() || {};
        
        // 24시간 이상 비활성 사용자 필터링
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        
        const userList = Object.entries(users)
            .filter(([id, user]) => {
                const isRecent = now - user.lastSeen < ONE_DAY;
                const hasToken = tokens[id]?.token;
                return isRecent && hasToken;
            })
            .map(([id, user]) => ({
                id,
                token: tokens[id].token,
                active: user.active,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt
            }))
            .sort((a, b) => b.lastSeen - a.lastSeen);

        res.json(userList);
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        res.status(500).json({ error: '사용자 목록 조회에 실패했습니다.' });
    }
});

// FCM 토큰 등록
app.post('/register-token', async (req, res) => {
    try {
        const { token, existingUserId, sessionId } = req.body;
        let userId = existingUserId;

        if (existingUserId) {
            await Promise.all([
                usersRef.child(existingUserId).update({
                    lastSeen: admin.database.ServerValue.TIMESTAMP,
                    sessionId,
                    active: true
                }),
                tokensRef.child(existingUserId).update({
                    token,
                    updatedAt: admin.database.ServerValue.TIMESTAMP
                })
            ]);
        } else {
            userId = `User_${Date.now()}`;
            await Promise.all([
                usersRef.child(userId).set({
                    createdAt: admin.database.ServerValue.TIMESTAMP,
                    lastSeen: admin.database.ServerValue.TIMESTAMP,
                    sessionId,
                    active: true
                }),
                tokensRef.child(userId).set({
                    token,
                    createdAt: admin.database.ServerValue.TIMESTAMP,
                    updatedAt: admin.database.ServerValue.TIMESTAMP
                })
            ]);
        }

        res.json({
            userId,
            message: existingUserId ? '토큰이 업데이트되었습니다.' : '토큰이 등록되었습니다.'
        });
    } catch (error) {
        console.error('토큰 등록 실패:', error);
        res.status(500).json({ error: '토큰 등록에 실패했습니다.' });
    }
});

// 푸시 메시지 전송
app.post('/send-push', async (req, res) => {
    try {
        const { userId } = req.body;
        
        const [userSnapshot, tokenSnapshot] = await Promise.all([
            usersRef.child(userId).once('value'),
            tokensRef.child(userId).once('value')
        ]);

        const userData = userSnapshot.val();
        const tokenData = tokenSnapshot.val();

        if (!userData || !tokenData || !tokenData.token) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }

        const message = {
            notification: {
                title: '새로운 알림',
                body: '푸시 메시지가 도착했습니다!'
            },
            token: tokenData.token
        };

        await admin.messaging().send(message);
        
        await usersRef.child(userId).update({
            lastSeen: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ message: '푸시 메시지가 전송되었습니다.' });
    } catch (error) {
        console.error('푸시 전송 실패:', error);
        res.status(500).json({ error: '푸시 전송에 실패했습니다.' });
    }
});

// 초기 접속 처리
app.post('/api/init-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: '세션 ID가 필요합니다.' });
        }

        // 새 사용자 생성
        const userId = `User_${Date.now()}`;
        const timestamp = admin.database.ServerValue.TIMESTAMP;

        await Promise.all([
            // 사용자 정보 저장
            usersRef.child(userId).set({
                createdAt: timestamp,
                lastSeen: timestamp,
                sessionId,
                active: true,
                userAgent: req.headers['user-agent'],
                ip: req.ip,
                lastAccess: {
                    timestamp,
                    path: req.path
                }
            }),
            // 빈 토큰 정보 생성 (나중에 업데이트됨)
            tokensRef.child(userId).set({
                createdAt: timestamp,
                updatedAt: timestamp
            })
        ]);

        console.log('새 사용자 등록 완료:', userId);
        res.json({ 
            userId,
            message: '세션이 초기화되었습니다.' 
        });

    } catch (error) {
        console.error('세션 초기화 실패:', error);
        res.status(500).json({ 
            error: '세션 초기화에 실패했습니다.',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`)
})

// 프로세스 종료 처리
process.on('SIGTERM', () => {
    console.log('서버를 종료합니다...');
    admin.database().goOffline();
    process.exit(0);
});