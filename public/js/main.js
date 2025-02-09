import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, onValue, get, set, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getMessaging, getToken } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDrpO0vDYn8nldMbV37mI49Yemk2VGE3X8",
    authDomain: "web-push-fe250.firebaseapp.com",
    projectId: "web-push-fe250",
    storageBucket: "web-push-fe250.firebasestorage.app",
    messagingSenderId: "475730596102",
    appId: "1:475730596102:web:954947b2d9be8aa5fc4e87",
    databaseURL: "https://web-push-fe250-default-rtdb.firebaseio.com"
};

// VAPID 키 설정
let VAPID_KEY;

async function getVapidKey() {
    const response = await fetch('/api/vapid-key');
    const data = await response.json();
    VAPID_KEY = data.vapidKey;
}

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const messaging = getMessaging(app);

// DOM 요소
const userSelect = document.getElementById('userSelect');
const activeStatus = document.getElementById('activeStatus');
const lastSeen = document.getElementById('lastSeen');
const pushTitle = document.getElementById('pushTitle');
const pushBody = document.getElementById('pushBody');
const sendPushButton = document.getElementById('sendPush');

// 서비스 워커 등록
async function registerServiceWorker() {
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
            console.log('서비스 워커가 등록되었습니다:', registration);
            return registration;
        }
        throw new Error('서비스 워커를 지원하지 않는 브라우저입니다.');
    } catch (error) {
        console.error('서비스 워커 등록 실패:', error);
        throw error;
    }
}

// FCM 토큰 관리
async function initializeFCM() {
    try {
        // 서비스 워커 등록
        const registration = await registerServiceWorker();
        
        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('알림 권한이 거부되었습니다.');
        }

        // 현재 사용자가 인증되어 있는지 확인
        if (!auth.currentUser) {
            throw new Error('사용자 인증이 필요합니다.');
        }

        // 사용자 토큰 가져오기
        const currentToken = await auth.currentUser.getIdToken(true);
        console.log('사용자 인증 토큰:', currentToken);

        // FCM 토큰 가져오기
        const fcmToken = await getToken(messaging, {
            vapidKey: "BD5v-v6vplspc36JSUVPG7zioQrTQ-OvI2VzVJivI-KYwea9NOtsv0rkgJWc4tiviYVYkt0NkHwIcIPcp1WLGwI",
            serviceWorkerRegistration: registration
        });

        if (fcmToken) {
            // 토큰 저장
            await saveUserToken(currentUserId, fcmToken);
            console.log('FCM 토큰이 저장되었습니다:', fcmToken);
        } else {
            throw new Error('FCM 토큰을 가져올 수 없습니다.');
        }
    } catch (error) {
        console.error('FCM 토큰 초기화 실패:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
}

// 토큰 저장
async function saveUserToken(userId, token) {
    const tokenRef = ref(db, `tokens/${userId}`);
    await set(tokenRef, {
        token: token,
        updatedAt: Date.now()
    });
}

// 세션 관리
const sessionId = generateSessionId();
let currentUserId = null;

// 세션 ID 생성
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
}

// 사용자 ID 생성
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Firebase 익명 인증
async function signInAnonymouslyToFirebase() {
    try {
        // 현재 인증 상태 확인
        if (auth.currentUser) {
            console.log('이미 인증된 사용자:', auth.currentUser.uid);
            return auth.currentUser;
        }

        // 익명 로그인 시도
        const userCredential = await signInAnonymously(auth);
        console.log('익명 인증 성공:', userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        console.error('익명 인증 실패:', error.code, error.message);
        if (error.code === 'auth/admin-restricted-operation') {
            console.error('익명 인증이 Firebase Console에서 활성화되지 않았습니다.');
        }
        throw error;
    }
}

// 사용자 초기화
async function initializeUser() {
    try {
        // Firebase 익명 인증 수행
        const firebaseUser = await signInAnonymouslyToFirebase();
        
        // 사용자 ID 설정
        currentUserId = firebaseUser.uid;
        localStorage.setItem('userId', currentUserId);
        
        // 사용자 데이터 업데이트
        await updateUserStatus(currentUserId, true);
        
        // FCM 초기화 (인증 후 수행)
        await initializeFCM();
        
        // 페이지 언로드 시 상태 업데이트
        window.addEventListener('beforeunload', async () => {
            await updateUserStatus(currentUserId, false);
        });
        
        // 주기적으로 lastSeen 업데이트 (1분마다)
        setInterval(() => {
            updateUserLastSeen(currentUserId);
        }, 60000);
        
        return currentUserId;
    } catch (error) {
        console.error('사용자 초기화 실패:', error);
        throw error;
    }
}

// 사용자 상태 업데이트
async function updateUserStatus(userId, isActive) {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    const userData = {
        sessionId,
        lastSeen: Date.now(),
        active: isActive
    };

    if (!snapshot.exists()) {
        // 새 사용자 생성
        await set(userRef, userData);
    } else {
        // 기존 사용자 업데이트
        await update(userRef, userData);
    }
}

// lastSeen 업데이트
async function updateUserLastSeen(userId) {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
        lastSeen: Date.now()
    });
}

// 사용자 목록 조회 및 표시
function initializeUserList() {
    const usersRef = ref(db, 'users');
    
    onValue(usersRef, (snapshot) => {
        // 기존 옵션 제거 (첫 번째 기본 옵션 제외)
        while (userSelect.options.length > 1) {
            userSelect.remove(1);
        }
        
        const users = snapshot.val();
        if (users) {
            Object.entries(users).forEach(([userId, userData]) => {
                const option = new Option(
                    `${userId}${userId === currentUserId ? ' (나)' : ''}`,
                    userId
                );
                userSelect.add(option);
            });

            // 현재 사용자 선택
            if (currentUserId) {
                userSelect.value = currentUserId;
                showUserStatus(currentUserId);
            }
        }
    });
}

// 선택한 사용자의 상태 표시
function showUserStatus(userId) {
    if (!userId) {
        activeStatus.textContent = '-';
        lastSeen.textContent = '-';
        return;
    }

    const userRef = ref(db, `users/${userId}`);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            activeStatus.textContent = userData.active ? '활성' : '비활성';
            lastSeen.textContent = new Date(userData.lastSeen).toLocaleString();
        } else {
            activeStatus.textContent = '사용자 없음';
            lastSeen.textContent = '-';
        }
    });
}

// 푸시 메시지 발송
async function sendPushNotification(userId, title, body) {
    try {
        // 사용자의 FCM 토큰 가져오기
        const tokenRef = ref(db, `tokens/${userId}`);
        const snapshot = await get(tokenRef);
        
        if (!snapshot.exists()) {
            throw new Error('사용자의 FCM 토큰이 없습니다.');
        }

        const { token } = snapshot.val();

        // 서버에 푸시 메시지 발송 요청
        const response = await fetch('/api/send-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                title,
                body,
                userId
            })
        });

        if (!response.ok) {
            throw new Error('푸시 메시지 발송에 실패했습니다.');
        }

        alert('푸시 메시지가 발송되었습니다.');
        
        // 입력 필드 초기화
        pushTitle.value = '';
        pushBody.value = '';
        
    } catch (error) {
        console.error('푸시 메시지 발송 실패:', error);
        alert(error.message);
    }
}

// 이벤트 리스너
userSelect.addEventListener('change', (e) => {
    showUserStatus(e.target.value);
});

sendPushButton.addEventListener('click', async () => {
    const selectedUserId = userSelect.value;
    const title = pushTitle.value.trim();
    const body = pushBody.value.trim();
    
    if (!selectedUserId) {
        alert('메시지를 받을 사용자를 선택해주세요.');
        return;
    }
    
    if (!title || !body) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
    }
    
    sendPushButton.disabled = true;
    try {
        await sendPushNotification(selectedUserId, title, body);
    } finally {
        sendPushButton.disabled = false;
    }
});

// 초기화
async function initialize() {
    try {
        // Firebase 익명 인증 먼저 수행
        await initializeUser();
        initializeUserList();
    } catch (error) {
        console.error('초기화 실패:', error);
    }
}

initialize(); 