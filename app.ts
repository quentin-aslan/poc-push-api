// Set-up express server
import fs from 'fs'
import https from 'https'
import http from 'http'
import webPush from 'web-push'
import bodyParser from 'body-parser'
import { Database, VapidKeys, Subscription, Notification } from "./types";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import express, { Request, Response } from "express";
const app = express();
const SERVER_PORT = process.env.PORT || 4000;
let CURRENT_DB: Low<Database> | undefined = undefined

// Functions
const getDb = async () => {
    if (CURRENT_DB) return CURRENT_DB
    const file = './db.json'
    if (!fs.existsSync(file)) fs.writeFileSync(file, '')

    const defaultData = { subscriptions: [], vapidKeys: { public: undefined, privateKey: undefined } }
    const adapter = new JSONFile<Database>(file)

    const db = new Low<Database>(adapter, defaultData)
    await db.read()
    CURRENT_DB = db
    return db
}
const getVapidKeys = async (): Promise<VapidKeys> => {
    try {
        const db = await getDb()

        if (db.data.vapidKeys.publicKey && db.data.vapidKeys.privateKey) return db.data.vapidKeys
        db.data.vapidKeys = webPush.generateVAPIDKeys()
        await db.write()
        return db.data.vapidKeys
    } catch (e) {
        console.error(e)
        return { publicKey: undefined, privateKey: undefined }
    }
}
const initWebPush = async () => {
    const vapidKeys = await getVapidKeys()
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) throw new Error('No vapid keys found')
    webPush.setVapidDetails(
        'mailto:quentin.aslan@outlook.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    )
}
const saveSubscriptionInDb = async (subscription: Subscription) => {
    const db = await getDb()
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
    const certs = getCertificate()
    if (!certs) {
        console.log('No certificates found, starting http server instead of https')
        return http.createServer(app)
    } else {
        console.log('Certificates found, starting https server')
        return https.createServer(certs, app)
    }
}

// Start server
app.use(bodyParser.json());
app.use(express.static('public'));
getServer().listen(SERVER_PORT, async () => {
    console.log(`Server started on port ${SERVER_PORT}`)
    await initWebPush()
})


// API ROUTES

app.get('/', (req: Request, res: Response) => res.status(200).sendFile('index.html'))

app.get('/vapidPublic', async (req: Request, res: Response) => {
    const db = await getDb()
    const vapidKeys = db.data.vapidKeys

    if (!vapidKeys.publicKey) return res.status(500).json({ message: 'No public key found' })
    res.status(200).json({vapid_public_key: vapidKeys.publicKey})
})

app.post('/subscribe', async (req: any, res: any) => {
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
app.post('/sendNotification', async (req: Request, res: Response) => {
    try {
        // get notification from params
        const notificationPayload: Notification = req.body;

        if(!notificationPayload.title || !notificationPayload.body) return res.status(400).json({ message: 'Notification must have a title and a body' })

        const db = await getDb()
        const subscriptions = db.data.subscriptions

        subscriptions.forEach(subscription => {
            webPush.sendNotification(
                subscription,
                JSON.stringify({ notification: notificationPayload })
            );
        })

        res.status(201).json({ message: 'Notification sent successfully.' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ message: 'Error when sending the notification.' });
    }
})
