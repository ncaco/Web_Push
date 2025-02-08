const { admin, usersRef, tokensRef } = require('./utils/firebase');

exports.handler = async (event) => {
    console.log('register-token 함수 시작');
    
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { token, existingUserId, sessionId } = JSON.parse(event.body);
        console.log('토큰 수신됨:', token.slice(-10));
        
        let userId = existingUserId;

        if (existingUserId) {
            console.log('기존 사용자 업데이트 시작:', existingUserId);
            try {
                await Promise.all([
                    usersRef.child(existingUserId).update({
                        lastSeen: admin.database.ServerValue.TIMESTAMP,
                        sessionId,
                        active: true
                    }).then(() => console.log('사용자 정보 업데이트 성공')),
                    tokensRef.child(existingUserId).update({
                        token,
                        updatedAt: admin.database.ServerValue.TIMESTAMP
                    }).then(() => console.log('토큰 업데이트 성공'))
                ]);
                console.log('사용자 업데이트 완료');
            } catch (error) {
                console.error('사용자 업데이트 실패:', error);
                throw error;
            }
        } else {
            userId = `User_${Date.now()}`;
            console.log('새 사용자 등록 시작:', userId);
            try {
                await Promise.all([
                    usersRef.child(userId).set({
                        createdAt: admin.database.ServerValue.TIMESTAMP,
                        lastSeen: admin.database.ServerValue.TIMESTAMP,
                        sessionId,
                        active: true
                    }).then(() => console.log('사용자 정보 저장 성공')),
                    tokensRef.child(userId).set({
                        token,
                        createdAt: admin.database.ServerValue.TIMESTAMP,
                        updatedAt: admin.database.ServerValue.TIMESTAMP
                    }).then(() => console.log('토큰 저장 성공'))
                ]);
                console.log('새 사용자 등록 완료');
            } catch (error) {
                console.error('새 사용자 등록 실패:', error);
                throw error;
            }
        }

        // 같은 세션의 다른 사용자는 비활성화
        const snapshot = await usersRef.once('value');
        const users = snapshot.val() || {};
        await Promise.all(
            Object.entries(users)
                .filter(([id, user]) => 
                    id !== userId && 
                    user.sessionId === sessionId && 
                    user.active
                )
                .map(([id]) => usersRef.child(id).update({ active: false }))
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                userId,
                message: existingUserId ? '사용자 정보가 업데이트되었습니다.' : '새 사용자가 등록되었습니다.'
            })
        };
    } catch (error) {
        console.error('사용자 등록 실패:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: '사용자 등록에 실패했습니다.',
                details: error.message 
            })
        };
    }
}; 