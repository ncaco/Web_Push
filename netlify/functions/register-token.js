const { admin, tokens } = require('./utils/firebase');

exports.handler = async (event) => {
    console.log('register-token 함수 시작');
    
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { token } = JSON.parse(event.body);
        console.log('토큰 수신됨:', token.slice(-10));  // 보안상 마지막 10자리만
        
        const userId = `User_${Date.now()}`;
        tokens.set(userId, token);
        console.log('새로운 사용자 등록:', userId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                userId,
                message: '토큰이 등록되었습니다.'
            })
        };
    } catch (error) {
        console.error('토큰 등록 실패:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: '토큰 등록에 실패했습니다.',
                details: error.message
            })
        };
    }
}; 