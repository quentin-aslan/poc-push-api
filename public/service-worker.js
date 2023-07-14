self.addEventListener('install', event => {
    console.log('Service worker installed');
});

self.addEventListener('push', event => {
    const data = event.data.json();

    const options = {
        body: data.notification.body,
        icon: data.notification.icon,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1 // To identify a notification -> TODO:  Must be unique ?
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.notification.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Notification was clicked');
    event.notification.close();
});
