import React, { useState } from 'react';
import io from 'socket.io-client';
import { deriveKey, decryptMessage } from './utils/crypto';
import Home from './components/Home';
import ChatPage from './components/chatPage';

const SOCKET_URL = 'http://localhost:3000'; // Default Server Port

export default function App() {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleJoinWithCredentials = async (joinRoomId, joinPassword) => {
    setError('');

    try {
      // Derive PBKDF2 key from password and roomId (as salt)
      const key = await deriveKey(joinPassword, joinRoomId);
      setCryptoKey(key);

      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        setRoomId(joinRoomId);
        setPassword(joinPassword);
        newSocket.emit('join_room', joinRoomId);
        setJoined(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('user_joined', (id) => {
        console.log('Another user joined');
      });

      newSocket.on('receive_message', async (data) => {
        // Attempt to decrypt incoming message using the local key
        if (!key) return;
        const decryptedText = await decryptMessage(key, {
          ciphertext: data.ciphertext,
          iv: data.iv,
        });

        if (decryptedText === null) {
          // Could not decrypt -> potentially wrong password or bad data
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: '[Encrypted message - Failed to decrypt]', isOwn: false, time: new Date().toLocaleTimeString() }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: decryptedText, isOwn: false, time: new Date().toLocaleTimeString() }
          ]);
        }
      });

    } catch (err) {
      console.error(err);
      setError('Failed to setup secure connection.');
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    setJoined(false);
    setSocket(null);
    setCryptoKey(null);
    setMessages([]);
    setRoomId('');
    setPassword('');
  };

  if (!joined) {
    return (
      <div className="app-container">
        {error && (
          <div className="global-error">
            {error}
            <button onClick={() => setError('')}>&times;</button>
          </div>
        )}
        <Home onJoin={handleJoinWithCredentials} />
      </div>
    );
  }

  return (
    <ChatPage 
      socket={socket}
      cryptoKey={cryptoKey}
      roomId={roomId}
      messages={messages}
      setMessages={setMessages}
      isConnected={isConnected}
      handleLeave={handleLeave}
    />
  );
}
