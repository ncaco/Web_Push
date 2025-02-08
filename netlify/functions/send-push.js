const { admin, tokens } = require('./utils/firebase');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userId } = JSON.parse(event.body);
        const token = tokens.get(userId);

        if (!token) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: '사용자를 찾을 수 없습니다.' })
            };
        }

        const message = {
            notification: {
                title: '새로운 알림',
                body: '푸시 메시지가 도착했습니다!'
            },
            token: token
        };

        await admin.messaging().send(message);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: '푸시 메시지가 전송되었습니다.' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '푸시 전송에 실패했습니다.' })
        };
    }
}; 