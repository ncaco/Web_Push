const { admin, usersRef, tokensRef } = require('./utils/firebase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { userId } = JSON.parse(event.body);
        
        // 사용자와 토큰 정보 조회
        const [userSnapshot, tokenSnapshot] = await Promise.all([
            usersRef.child(userId).once('value'),
            tokensRef.child(userId).once('value')
        ]);

        const userData = userSnapshot.val();
        const tokenData = tokenSnapshot.val();

        if (!userData || !tokenData || !tokenData.token) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: '사용자를 찾을 수 없습니다.' })
            };
        }

        const message = {
            notification: {
                title: '새로운 알림',
                body: '푸시 메시지가 도착했습니다!'
            },
            token: tokenData.token
        };

        await admin.messaging().send(message);
        
        // lastSeen 업데이트
        await usersRef.child(userId).update({
            lastSeen: admin.database.ServerValue.TIMESTAMP
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: '푸시 메시지가 전송되었습니다.' })
        };
    } catch (error) {
        console.error('푸시 전송 실패:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: '푸시 전송에 실패했습니다.',
                details: error.message 
            })
        };
    }
}; 