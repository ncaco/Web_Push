const { tokens } = require('./utils/firebase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const tokenList = Array.from(tokens.entries()).map(([id, token]) => ({
            id,
            token
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tokenList)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '토큰 목록 조회에 실패했습니다.' })
        };
    }
}; 