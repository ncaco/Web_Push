self.addEventListener('push', (event) => {    
    self.registration.sendNotification('test message', {});
})
