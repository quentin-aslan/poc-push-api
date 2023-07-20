# Push API Notification POC 🚀

This project is a backend developed in Node.js with Express. It implements a push notification server using Web Push. The data is stored locally using the LowDB JSON database.

## Installation

1. Make sure you have Node.js installed on your machine.
2. Clone this source code repository.
3. Run the following command to install dependencies:

```bash
npm install
```


## Server Startup

To start the server, use the following command:

```bash
npm start
```


The server will launch on the port specified in the `PORT` environment variable or on port 4000 by default. 🚀

## API Routes

- `GET /`: This route returns the HTML homepage.
- `GET /vapidPublic`: This route returns the VAPID public key required for subscribing to push notifications.
- `POST /subscribe`: This route allows registering a new subscription for push notifications. It expects a JSON object containing the subscription's endpoint and keys.
- `POST /sendNotification`: This route sends a push notification to all registered subscriptions. It expects a JSON object containing the title and body of the notification.

## Configuration

When the server starts, it automatically generates a VAPID key pair if they don't already exist. The keys are stored in the LowDB JSON database.

The database configuration is located in the `db.json` file. If the file doesn't exist, it will be created automatically when the server starts. 🔑

## Database

This project uses LowDB, a lightweight JSON database. The data is stored in the `db.json` file. If the file doesn't exist, it will be created automatically on the first server startup. 💾

## Frontend

The associated frontend for this backend is a simple HTML page with a button to enable push notifications and a form to send notifications to all subscribers.

### Service Worker Installation

When the page is loaded, the `main.js` JavaScript file takes care of installing the service worker and registering the user for push notifications.

### Service Worker

The `service-worker.js` file is responsible for receiving and displaying the push notifications sent by the server. 📲

## Notes

- Make sure you have the SSL certificates (`fullchain.pem` and `privkey.pem`) in the "certs" directory to start an HTTPS server. If the certificates are not present, the server will start in HTTP mode.

- On iOS, in order to receive push notifications, the user needs to add the application to their home screen. Otherwise, push notifications will not be displayed. Make sure to inform users about this requirement. ℹ️

Remember to update the email addresses and any other necessary configurations for sending push notifications in the backend and frontend files.

That's it! You can now use this backend to manage push notifications in your application. 🎉

Feel free to let me know if you have any further questions! 🙌



