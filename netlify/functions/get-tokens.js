const { usersRef, tokensRef } = require('./utils/firebase');

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
        
        const userList = Object.entries(users)
            .filter(([id]) => tokens[id]?.token)
            .map(([id, user]) => ({
                id,
                token: tokens[id].token,
                active: user.active || false,
                lastSeen: user.lastSeen || 0
            }));

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
            body: JSON.stringify({ error: error.message })
        };
    }
}; 