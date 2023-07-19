// Set-up express server
const fs = require('fs')
const https = require('https')
const http = require('http')
const webPush = require('web-push');
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const express = require('express');
const app = express();
const SERVER_PORT = process.env.PORT || 4000;
let CURRENT_DB = undefined

// Functions
const getDb = () => {
    if (CURRENT_DB) return CURRENT_DB
    const file = './db.json'
    if (!fs.existsSync(file)) fs.writeFileSync(file, '')
    const defaultData = { subscriptions: [], vapidKeys: { public: undefined, privateKey: undefined } }
    const adapter = new JSONFile(file)
    const db = new Low(adapter, defaultData)
    CURRENT_DB = db
    return db
}
const getVapidKeys = async () => {
    const db = getDb()
    if (db.data.vapidKeys.publicKey && db.data.vapidKeys.privateKey) return db.data.vapidKeys
    db.data.vapidKeys = webPush.generateVAPIDKeys()
    await db.write()
}
const initwebPush = async () => {
    const vapidKeys = await getVapidKeys()
    webPush.setVapidDetails(
        'mailto:quentin.aslan@outlook.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    )
}
const saveSubscriptionInDb = async (subscription) => {
    const db = getDb()
    const user = db.data.subscriptions.find(user => user.endpoint === subscription.endpoint)
    if (!user) {
        db.data.subscriptions.push(subscription)
        await db.write()
    }
}
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

// Start server
app.use(require('body-parser').json());
app.use(express.static('public'));
getServer().listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`))

initwebPush()


// API ROUTES

app.get('/', (req, res) => {
    res.status(200).sendFile('index.html');
})

app.get('/vapid_public', (req, res) => {
    res.status(200).json({vapid_public_key: vapidKeys.publicKey})
})

app.post('/subscribe', async (req, res) => {
    try {
        const subscription = req.body;
        // Check if subscription have all keys
        if (!subscription.endpoint || !subscription.keys) {
            res.status(400).json({ message: 'Subscription must have an endpoint and keys' });
        }

        await saveSubscriptionInDb(subscription)
        res.status(201).json({ message: 'Subscription added successfully.' });
    } catch (e) {
        res.status(500).json({ message: 'Error when saving the subscription.' });
    }
});


// Send a push notification
app.post('/sendNotification', (req, res) => {
    try {
        const notificationPayload = {
            notification: {
                title: 'New Notification',
                body: 'This is the body of the notification',
                icon: 'icon.png',
            },
        };

        const subscriptions = getDb().data.subscriptions
        subscriptions.forEach(subscription => {
            webPush.sendNotification(
                subscription,
                JSON.stringify(notificationPayload)
            );
        })

        res.status(201).json({ message: 'Notification sent successfully.' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ message: 'Error when sending the notification.' });
    }
})
