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
                data: {
                    url: data.data?.url || '/',
                    linkType: data.data?.linkType || 'current'
                },
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
    console.log('알림 데이터:', event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const { url, linkType } = event.notification.data;
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // 현재 활성화된 창 찾기
            const activeClient = clientList.find(client => 
                client.visibilityState === 'visible' || client.focused
            );

            if (linkType === 'current' && activeClient) {
                // 현재 창이 있고 현재 창으로 열기가 선택된 경우
                if (url.startsWith('/') || url.startsWith(self.registration.scope)) {
                    // 내부 URL인 경우 navigate 사용
                    return activeClient.navigate(url).then(client => client.focus());
                } else {
                    // 외부 URL인 경우 location 변경
                    return activeClient.focus().then(() => {
                        activeClient.postMessage({
                            type: 'NAVIGATE',
                            url: url
                        });
                    });
                }
            }
            // 새 창으로 열기
            return clients.openWindow(url);
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
            data: {
                url: payload.data?.url || '/',
                linkType: payload.data?.linkType || 'current'
            },
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

const handleMessageOpen = (messageId) => {
    // 새 창의 크기와 위치 설정
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // 새 창 열기
    window.open(
        `/messages/${messageId}`,
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
};

// 메시지 수신 처리
self.addEventListener('message', function(event) {
    console.log('Message received:', event.data);
}); 