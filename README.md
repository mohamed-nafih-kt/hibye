# Secure E2E Chat App

A highly secure, temporary, and end-to-end encrypted chat application. 

## Features
- **End-to-End Encryption**: Messages are encrypted in the browser using AES-GCM before being sent over the network.
- **Zero Data Collection**: The server merely relays encrypted messages and does not store logs, messages, or user data. No databases are used.
- **Ephemeral Sessions**: Sessions only exist as long as users are connected.

## Technologies Used
- **Client**: React, Vite, WebCrypto API (PBKDF2, AES-GCM), Socket.io-client, Vanilla CSS (Tailwind-like custom properties)
- **Server**: Node.js, Express, Socket.io, Helmet, CORS

## Setup and Usage

### 1. Installation
Install dependencies for both server and client:
```sh
cd server
npm install

cd ../client
npm install
```

### 2. Running the App
You can start both the client and server concurrently using the provided script (make sure to give it execution permissions `chmod +x start.sh`):

```sh
./start.sh
```

Alternatively, start them separately:
- **Server**: `cd server && npm start` (or `node server.js` - runs on port 3000)
- **Client**: `cd client && npm run dev` (runs on port 5173)

### 3. Usage
1. Open the app in your browser (usually `http://localhost:5173`).
2. Enter a unique **Chat ID** and a strong **Password**.
3. Share the Chat ID and Password with your peer through a secure mechanism.
4. When your peer joins using the exact same credentials, you can begin chatting. Any incorrect password will result in the inability to decrypt the messages.
