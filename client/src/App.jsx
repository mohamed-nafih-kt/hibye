import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import { deriveKey, decryptMessage } from './utils/crypto';
import HomeSelection from './components/HomeSelection/HomeSelection';
import StartChat from './components/StartChat/StartChat';
import JoinChat from './components/JoinChat/JoinChat';
import ChatPage from './components/ChatPage/ChatPage';

const SOCKET_URL = 'http://localhost:3000'; // Default Server Port

export default function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleJoinWithCredentials = async (joinRoomId, joinPassword) => {
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
      // We generally want to emit an error state here or throw back, handled by children ideally.
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setCryptoKey(null);
    setMessages([]);
    setRoomId('');
    setPassword('');
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomeSelection />} />
          <Route path="/start" element={<StartChat onJoin={handleJoinWithCredentials} />} />
          <Route path="/join" element={<JoinChat onJoin={handleJoinWithCredentials} />} />
          <Route 
            path="/chat" 
            element={
              <ChatPage 
                socket={socket}
                cryptoKey={cryptoKey}
                roomId={roomId}
                messages={messages}
                setMessages={setMessages}
                isConnected={isConnected}
                handleLeave={handleLeave}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
