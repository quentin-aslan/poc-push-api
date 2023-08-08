// Set-up express server
import cors from 'cors'
import https from 'https'
import http from 'http'
import webPush from 'web-push'
import bodyParser from 'body-parser'
import {Notification, PillStatus, User} from "./types.js";
import express, { Request, Response } from "express";
import {getCertificate, getDb, initWebPush} from './utils.js';
import {initCheckPillsStatus, updatePillStatus} from "./pills-reminder.js";
const app = express();
const SERVER_PORT = process.env.PORT || 4000;

// Functions
const saveUserInDb = async (userData: User) => {
    const db = await getDb()
    const userDb = db.data.users.find(user => user.name === userData.name)

    if (!userDb) {
        if(!userData.pillsHistory) userData.pillsHistory = []

        db.data.users.push(userData)
        await db.write()
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
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
getServer().listen(SERVER_PORT, async () => {
    console.log(`Server started on port ${SERVER_PORT}`)
    await initWebPush()
    await initCheckPillsStatus()
})

// API ROUTES

app.get('/', (req: Request, res: Response) => res.status(200).sendFile('index.html'))

app.get('/vapidPublic', async (req: Request, res: Response) => {
    const db = await getDb()
    const vapidKeys = db.data.vapidKeys

    if (!vapidKeys.publicKey) return res.status(500).json({ message: 'No public key found' })
    return res.status(200).json({vapid_public_key: vapidKeys.publicKey})
})

app.post('/subscribe', async (req: any, res: any) => {
    try {
        const data: User = req.body;

        // Check if subscription have all keys
        if (!data.name || !data.subscription || !data.subscription.endpoint || !data.subscription.keys) {
            return res.status(400).json({ message: 'Username, endpoint and keys properties are mandatory' });
        }

        await saveUserInDb(data)
        return res.status(201).json({ message: 'Subscription added successfully.' });
    } catch (e) {
        return res.status(500).json({ message: 'Error when saving the subscription.' });
    }
});

// Send a push notification
app.post('/sendNotification', async (req: Request, res: Response) => {
    try {
        // get notification from params
        const notificationPayload: Notification = req.body;

        if(!notificationPayload.title || !notificationPayload.body) return res.status(400).json({ message: 'Notification must have a title and a body' })

        const db = await getDb()
        const users = db.data.users

        for (const user of users) {
            try {
                await webPush.sendNotification(
                    user.subscription,
                    JSON.stringify({ notification: notificationPayload })
                );
            } catch (e) {
                console.log("Error when sending notification to " + user.name)
            }
        }

        return res.status(201).json({ message: 'Notifications sent successfully.' })
    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'Error when sending the notification.' });
    }
})

app.post('/pillStatus', async (req: any, res: any) => {
    try {
        const pillStatus: PillStatus = req.body;
        // Check if subscription have all keys
        if (!pillStatus.username || !pillStatus.taken) {
            return res.status(400).json({ message: 'Username or taken properties missed' });
        }

        const user = await updatePillStatus(pillStatus)

        return res.status(200).json(user);
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: 'Error when saving the pill status.' });
    }
});

app.get('/getUser', async (req: any, res: any) => {
    try {
        const username = req.query.username
        if (!username) return res.status(400).json({ message: 'Username is required' });

        const db = await getDb()
        const user = db.data.users.find(user => user.name === username)


        if (!user) return res.status(400).json({ message: 'Wrong username !' });

        return res.status(200).json(user);
    } catch (e) {
        return res.status(500).json({ message: 'Error when getting the pills history.' });
    }
})