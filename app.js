// Set-up express server

const express = require('express');
const webpush = require('web-push');
const app = express();

app.use(require('body-parser').json());

app.listen(3000, () => {
    console.log('Server started on port 3000');
});

// Generate VAPID Keys
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Vapid Keys')
console.log(vapidKeys);


// Set VAPID Details
webpush.setVapidDetails(
    'mailto:quentin.aslan@outlook.com', // Your email
    vapidKeys.publicKey,   // Your public VAPID key
    vapidKeys.privateKey   // Your private VAPID key
);

// Handle subscription

let savedSubscription;

app.post('/subscribe', (req, res) => {
    savedSubscription = req.body;
    res.status(201).json({});
});


// Send a push notification
app.post('/sendNotification', (req, res) => {
    const notificationPayload = {
        notification: {
            title: 'New Notification',
            body: 'This is the body of the notification',
            //icon: 'assets/icons/icon-512x512.png',
        },
    };

    const pushSubscription = savedSubscription;

    webpush.sendNotification(
        pushSubscription,
        JSON.stringify(notificationPayload)
    );

    res.status(200).json({});
});
