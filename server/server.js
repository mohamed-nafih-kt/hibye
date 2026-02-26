const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins a room identified by the chat ID
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        // Notify others in the room
        socket.to(roomId).emit('user_joined', socket.id);
    });

    // Relay encrypted messages directly to the room
    // We do NOT store anything on the server.
    socket.on('send_message', (data) => {
        const { roomId, message } = data;
        console.log(`Relaying message in room: ${roomId}`);
        socket.to(roomId).emit('receive_message', {
            senderId: socket.id,
            ...message
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Secure relay server running on port ${PORT}`);
});
