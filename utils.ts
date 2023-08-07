import fs from "fs";
import {JSONFile} from "lowdb/node";
import {Database, VapidKeys} from "./types";
import {Low} from "lowdb";
import webPush from "web-push";

let CURRENT_DB: Low<Database> | undefined = undefined
export const getDb = async () => {
    if (CURRENT_DB) return CURRENT_DB
    const file = './db.json'

    const adapter = new JSONFile<Database>(file)
    const defaultData = { users: [], vapidKeys: { public: undefined, privateKey: undefined } }
    const db = new Low<Database>(adapter, defaultData)

    await db.read()
    CURRENT_DB = db
    return db
}
export const getVapidKeys = async (): Promise<VapidKeys> => {
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
export const initWebPush = async () => {
    const vapidKeys = await getVapidKeys()
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) throw new Error('No vapid keys found')
    webPush.setVapidDetails(
        'mailto:quentin.aslan@outlook.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    )
}
export const getCertificate = () => {
    const fullchainPath = './certs/fullchain.pem'
    const privkeyPath = './certs/privkey.pem'
    if (!fs.existsSync(fullchainPath) || !fs.existsSync(privkeyPath)) return false

    return {
        cert: fs.readFileSync('./certs/fullchain.pem'),
        key: fs.readFileSync('./certs/privkey.pem')
    }
}

export const isToday = (someDate: Date) => {
    const today = new Date()
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear()
}