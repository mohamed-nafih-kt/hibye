import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Shield, Lock, Send, LogOut } from 'lucide-react';
import { deriveKey, encryptMessage, decryptMessage } from './utils/crypto';
import Home from './components/Home';

const SOCKET_URL = 'http://localhost:3000'; // Default Server Port

export default function App() {
  const [socket, setSocket] = useState(null);
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !cryptoKey) return;

    try {
      // Encrypt the message locally
      const encryptedPayload = await encryptMessage(cryptoKey, newMessage);

      // Send the encrypted blob to the relay server
      socket.emit('send_message', {
        roomId,
        message: encryptedPayload
      });

      // Add to local state as our own message
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: newMessage, isOwn: true, time: new Date().toLocaleTimeString() }
      ]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
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
    <div className="glass-panel chat-container">
      <div className="chat-header">
        <div>
          <h2><Shield size={20} color="var(--primary)" /> Session: {roomId}</h2>
          <p>End-to-End Encrypted</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`status-badge ${!isConnected ? 'disconnected' : ''}`}>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
          <button onClick={handleLeave} className="icon-btn" style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.25rem' }} title="Leave Room">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
            <Lock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Session initialized.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Messages are not stored and will be permanently lost when you leave.</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.isOwn ? 'own' : 'peer'}`}>
            <div className="text">{msg.text}</div>
            <div className="time">{msg.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="input-area">
        <input 
          type="text" 
          placeholder="Type an encrypted message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="icon-btn" disabled={!newMessage.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
