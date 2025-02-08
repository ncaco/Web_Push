const { usersRef, tokensRef, checkConnection } = require('./utils/firebase');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        // 연결 상태 확인
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('Firebase 연결 실패');
        }

        // OPTIONS 요청 처리
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        console.log('사용자 목록 조회 시작');
        const [usersSnapshot, tokensSnapshot] = await Promise.all([
            usersRef.once('value'),
            tokensRef.once('value')
        ]);
        
        const users = usersSnapshot.val() || {};
        const tokens = tokensSnapshot.val() || {};
        console.log('데이터 조회 완료:', { 
            usersCount: Object.keys(users).length, 
            tokensCount: Object.keys(tokens).length 
        });
        
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        
        const userList = Object.entries(users)
            .filter(([id, user]) => {
                const isRecent = now - (user.lastSeen || 0) < ONE_DAY;
                const hasToken = tokens[id]?.token;
                return isRecent && hasToken;
            })
            .map(([id, user]) => ({
                id,
                token: tokens[id].token,
                active: user.active || false,
                lastSeen: user.lastSeen || 0,
                createdAt: user.createdAt || 0
            }))
            .sort((a, b) => b.lastSeen - a.lastSeen);

        console.log('응답 데이터 준비:', { activeUsers: userList.length });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(userList)
        };
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '사용자 목록 조회에 실패했습니다.',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
}; 