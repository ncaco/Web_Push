importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDrpO0vDYn8nldMbV37mI49Yemk2VGE3X8",
    authDomain: "web-push-fe250.firebaseapp.com",
    projectId: "web-push-fe250",
    storageBucket: "web-push-fe250.firebasestorage.app",
    messagingSenderId: "475730596102",
    appId: "1:475730596102:web:954947b2d9be8aa5fc4e87"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] 백그라운드 메시지 수신:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'  // 알림에 표시될 아이콘
    };

    console.log('[Service Worker] 알림 표시 중...');
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('[Service Worker] Firebase Messaging Service Worker 로드됨'); 