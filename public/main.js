document.getElementById('subscribe').onclick = () => {
    try {
        checkBrowserCompatibility();
        askNotificationPermission().then(subscribeUserToPush)
    } catch (e) {
        console.error('Unable to register service worker', e);
    }
}

const serviceWorkerRegistration = async () => {
    return new Promise((resolve) => {
        const client_url = window.location.href
        navigator.serviceWorker.getRegistration(client_url).then((registration) => {
            if (registration) return resolve(registration) // Service worker is already registered
            return resolve(navigator.serviceWorker.register('service-worker.js'))
        })
    })
}

const checkBrowserCompatibility = () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported by this browser')
    if (!('PushManager' in window)) throw new Error('Push notifications are not supported by this browser')
}

const askNotificationPermission = () => {
    return new Promise((resolve, reject) => {
        Notification.requestPermission().then((permissionResult) => {
            if (permissionResult !== 'granted') reject('We weren\'t granted permission to receive push notifications.')
            resolve()
        })
    })
}

const subscribeUserToPush = async () => {
    try {
        const serviceWorker = await serviceWorkerRegistration()

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