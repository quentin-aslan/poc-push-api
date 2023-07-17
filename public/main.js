document.getElementById('subscribe').onclick = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
        await navigator.serviceWorker.register('service-worker.js')
        console.log('Service worker registered successfully');
        await askNotificationPermission()
        await subscribeUserToPush();
    } catch (e) {
        console.error('Unable to register service worker', e);
    }
};

const askNotificationPermission = async () => {
    const permissionResult = await Notification.requestPermission()
    if (permissionResult !== 'granted') {
        throw new Error('We weren\'t granted permission to receive push notifications.');
    }
}

// The purpose of this function is to take a base64-encoded string and convert it to a Uint8Array
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const getVapidPublicKey = async () => {
    const response = await fetch('/vapid_public')
    const data = await response.json()
    return data.vapid_public_key
}
const  subscribeUserToPush = async () => {
    try {
        const serviceWorker = await navigator.serviceWorker.register('service-worker.js')

        const public_key = await getVapidPublicKey()
        const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(public_key)
        }

        const pushSubscription = await serviceWorker.pushManager.subscribe(subscribeOptions)

        console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
        // Send the subscription details to the server using the Fetch API
        await fetch('/subscribe', {
            method: 'post',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(pushSubscription),
        })

        return pushSubscription;
    } catch (e) {
        console.error(e)
    }
}