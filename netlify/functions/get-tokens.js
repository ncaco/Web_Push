const { admin, usersRef, tokensRef } = require('./utils/firebase');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const [usersSnapshot, tokensSnapshot] = await Promise.all([
            usersRef.once('value'),
            tokensRef.once('value')
        ]);
        
        const users = usersSnapshot.val() || {};
        const tokens = tokensSnapshot.val() || {};
        
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(userList)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: '사용자 목록 조회에 실패했습니다.' })
        };
    }
}; 