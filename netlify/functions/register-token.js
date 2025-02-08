const { admin, tokens } = require('./utils/firebase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { token } = JSON.parse(event.body);
        const userId = `User_${Date.now()}`;
        tokens.set(userId, token);

        return {
            statusCode: 200,
            body: JSON.stringify({
                userId,
                message: '토큰이 등록되었습니다.'
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: '토큰 등록에 실패했습니다.'
            })
        };
    }
}; 