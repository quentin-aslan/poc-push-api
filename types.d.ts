export type Subscription = {
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    }
}

export type VapidKeys = {
    publicKey?: string;
    privateKey?: string;
}

export type Database = {
    subscriptions: Subscription[]
    vapidKeys: VapidKeys
}

export type Notification = {
    title: string;
    body: string;
    icon: string;
}