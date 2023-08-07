export type Database = {
    users: User[]
    vapidKeys: VapidKeys
}

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

export type User = {
    name: string,
    subscription: Subscription,
    pillsHistory: PillHistory[]
}

export type Notification = {
    title: string;
    body: string;
    icon?: string;
}

export type PillHistory = {
    date: Date,
    notifications: number,
    taken: boolean
}

type PillStatus = {
    username: string,
    taken: boolean
}