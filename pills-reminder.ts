import {Notification} from "./types";
import webPush from "web-push";
import {getDb, isToday} from "./utils.js";


const INTERVAL_CHECK_PILLS_STATUS = 3000 // 5 mins
const NOTIFICATION_MAX = 10
const checkPillStatus = async () => {
    console.log('Checking pill status ...', new Date().toString())
    const db = await getDb()
    const users = db.data.users

    for (const user of users) {
        let pillHistoryIndex = user?.pillsHistory.findIndex(pillDatas => isToday(new Date(pillDatas.date)))

        // If no pill history for today, create one
        if (pillHistoryIndex === -1) {
            user.pillsHistory.push({date: new Date(), taken: false, notifications: 0})
            pillHistoryIndex = 0
        }

        // If pill not taken and less than NOTIFICATION_MAX, send one
        if (!user.pillsHistory[pillHistoryIndex].taken && user.pillsHistory[pillHistoryIndex].notifications < NOTIFICATION_MAX) {
            const notificationPayload: Notification = {
                title: 'Pill reminder',
                body: 'Did you take your pill today ?'
            }

            try {
                console.log("Sending notification to " + user.name)
                await webPush.sendNotification(
                    user.subscription,
                    JSON.stringify({ notification: notificationPayload })
                );

                // user.pillsHistory[pillHistoryIndex].notifications++
            } catch (e) {
                return console.log("Error when sending notification to " + user.name)
            }
        }
    }
    await db.write()
}

export const initCheckPillsStatus = () => {
    console.log('Init check pill status interval | every : (ms)', INTERVAL_CHECK_PILLS_STATUS)
    setInterval(checkPillStatus, INTERVAL_CHECK_PILLS_STATUS)
}

