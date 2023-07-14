// Set-up express server

const express = require('express');
const webpush = require('web-push');
const app = express();

app.use(require('body-parser').json());

app.listen(3000, () => {
    console.log('Server started on port 3000');
    // display public adress of the server (not localhost

});

// Generate VAPID Keys
// const vapidKeys = webpush.generateVAPIDKeys();


const vapidKeys = {
    publicKey: 'BIo5NOSDvPB1w69wLIEx2or-QU78-OIbseYO6HfrA9Soz-hZ6tq-DxoASYxoDn0L9Chu2Ile_R5qiMKnb3tZoVM',
    privateKey: '0hImWJil0riPbQ3OYHt6kW-98jAnc16Drh1avTRLIDc'
}

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

// Create a api route who send index.html

// declare a folder who contains static files
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

app.get('/vapid_public', (req, res) => {
    res.status(200).json({vapid_public_key: vapidKeys.publicKey})
})

app.post('/subscribe', (req, res) => {
    savedSubscription = req.body;
    console.log('subscribe user ...')
    console.log(savedSubscription)
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
