const { ref, get, set, update, remove, query, orderByChild } = require('firebase/database');
const { rtdb } = require('./firebase');

// Users 관련 함수들
const usersRef = ref(rtdb, 'users');

// 사용자 조회
const getUser = async (userId) => {
    const userRef = ref(rtdb, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
};

// 모든 사용자 조회
const getAllUsers = async () => {
    const snapshot = await get(usersRef);
    return snapshot.exists() ? snapshot.val() : {};
};

// 활성 사용자만 조회
const getActiveUsers = async () => {
    const activeUsersQuery = query(usersRef, orderByChild('active'), true);
    const snapshot = await get(activeUsersQuery);
    return snapshot.exists() ? snapshot.val() : {};
};

// 사용자 생성/수정
const upsertUser = async (userId, userData) => {
    const userRef = ref(rtdb, `users/${userId}`);
    const validData = {
        sessionId: userData.sessionId,
        lastSeen: userData.lastSeen || Date.now(),
        active: userData.active || true,
        timestamp: Date.now()
    };
    await set(userRef, validData);
    return validData;
};

// 사용자 부분 수정
const updateUser = async (userId, updates) => {
    const userRef = ref(rtdb, `users/${userId}`);
    await update(userRef, updates);
    return updates;
};

// 사용자 삭제
const deleteUser = async (userId) => {
    const userRef = ref(rtdb, `users/${userId}`);
    await remove(userRef);
};

// Tokens 관련 함수들
const tokensRef = ref(rtdb, 'tokens');

// 토큰 조회
const getToken = async (userId) => {
    const tokenRef = ref(rtdb, `tokens/${userId}`);
    const snapshot = await get(tokenRef);
    return snapshot.exists() ? snapshot.val() : null;
};

// 모든 토큰 조회
const getAllTokens = async () => {
    const snapshot = await get(tokensRef);
    return snapshot.exists() ? snapshot.val() : {};
};

// 토큰 생성/수정
const upsertToken = async (userId, tokenData) => {
    const tokenRef = ref(rtdb, `tokens/${userId}`);
    const validData = {
        token: tokenData.token,
        timestamp: Date.now()
    };
    await set(tokenRef, validData);
    return validData;
};

// 토큰 삭제
const deleteToken = async (userId) => {
    const tokenRef = ref(rtdb, `tokens/${userId}`);
    await remove(tokenRef);
};

module.exports = {
    // Users
    getUser,
    getAllUsers,
    getActiveUsers,
    upsertUser,
    updateUser,
    deleteUser,
    
    // Tokens
    getToken,
    getAllTokens,
    upsertToken,
    deleteToken
}; 