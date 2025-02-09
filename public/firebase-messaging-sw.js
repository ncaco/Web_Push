importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDrpO0vDYn8nldMbV37mI49Yemk2VGE3X8",
    authDomain: "web-push-fe250.firebaseapp.com",
    databaseURL: "https://web-push-fe250-default-rtdb.firebaseio.com",
    projectId: "web-push-fe250",
    storageBucket: "web-push-fe250.firebasestorage.app",
    messagingSenderId: "475730596102",
    appId: "1:475730596102:web:954947b2d9be8aa5fc4e87"
};

let messaging;

try {
    // Firebase 초기화 전에 설정 유효성 확인
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error('Firebase 설정이 올바르지 않습니다.');
    }
    
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized in service worker');
    
    // 초기화 성공 후 messaging 인스턴스 생성
    messaging = firebase.messaging();
    console.log('Firebase Messaging initialized');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// 포그라운드 메시지 처리
self.addEventListener('push', function(event) {
    console.log('Push 이벤트 수신:', event);
    
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('Push 데이터:', data);
            
            const options = {
                body: data.notification.body,
                icon: '/icon.png',
                badge: '/icon.png',
                data: data.data,
                requireInteraction: true,
                actions: [
                    {
                        action: 'open',
                        title: '열기'
                    },
                    {
                        action: 'close',
                        title: '닫기'
                    }
                ]
            };
            
            event.waitUntil(
                self.registration.showNotification(data.notification.title, options)
            );
        } catch (error) {
            console.error('Push 메시지 처리 중 오류:', error);
        }
    }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', function(event) {
    console.log('알림 클릭:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            for (let client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(urlToOpen);
        })
    );
});

// 백그라운드 메시지 처리
if (messaging) {
    messaging.onBackgroundMessage((payload) => {
        console.log('백그라운드 메시지 수신:', payload);
        
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon.png',
            badge: '/icon.png',
            data: payload.data,
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: '열기'
                },
                {
                    action: 'close',
                    title: '닫기'
                }
            ]
        };
        
        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
} 