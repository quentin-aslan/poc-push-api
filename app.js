// Set-up express server
const fs = require('fs')
const https = require('https')
const http = require('http')
const express = require('express');
const webpush = require('web-push');
const app = express();
const SERVER_PORT = process.env.PORT || 4000;

app.use(require('body-parser').json());
app.use(express.static('public'));

const getCertificate = () => {
    const fullchainPath = './certs/fullchain.pem'
    const privkeyPath = './certs/privkey.pem'
    if (!fs.existsSync(fullchainPath) || !fs.existsSync(privkeyPath)) return false

    return {
        cert: fs.readFileSync('./certs/fullchain.pem'),
        key: fs.readFileSync('./certs/privkey.pem')
    }
}

const getServer = () => {
    if (!getCertificate()) {
        console.log('No certificates found, starting http server instead of https')
        return http.createServer(app)
    } else {
        console.log('Certificates found, starting https server')
        return https.createServer(getCertificate(), app)
    }
}

getServer().listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`))

// Generate VAPID Keys
// const vapidKeys = webpush.generateVAPIDKeys();


const vapidKeys = {
    publicKey: 'BIo5NOSDvPB1w69wLIEx2or-QU78-OIbseYO6HfrA9Soz-hZ6tq-DxoASYxoDn0L9Chu2Ile_R5qiMKnb3tZoVM',
    privateKey: '0hImWJil0riPbQ3OYHt6kW-98jAnc16Drh1avTRLIDc'
}

console.log('Vapid Keys')


// Set VAPID Details
webpush.setVapidDetails(
    'mailto:quentin.aslan@outlook.com', // Your email
    vapidKeys.publicKey,   // Your public VAPID key
    vapidKeys.privateKey   // Your private VAPID key
);

// Handle subscription

let savedSubscription;

// Create a api route who send index.html

app.get('/', (req, res) => {
    res.status(200).sendFile('index.html');
})

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
            icon: 'icon.png',
        },
    };

    webpush.sendNotification(
        savedSubscription,
        JSON.stringify(notificationPayload)
    );

    res.sendStatus(200)
});
