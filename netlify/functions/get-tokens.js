const { usersRef, tokensRef } = require('./utils/firebase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

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

        // 오래된 데이터 정리
        const cleanupPromises = Object.entries(users)
            .filter(([id, user]) => now - user.lastSeen >= ONE_DAY)
            .map(async ([id]) => {
                await usersRef.child(id).remove();
                await tokensRef.child(id).remove();
                console.log('오래된 사용자 삭제:', id);
            });

        await Promise.all(cleanupPromises);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(userList)
        };
    } catch (error) {
        console.error('사용자 목록 조회 실패:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: '사용자 목록 조회에 실패했습니다.' })
        };
    }
}; 