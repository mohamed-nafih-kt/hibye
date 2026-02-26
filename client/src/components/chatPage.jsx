import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Send, LogOut } from 'lucide-react';
import { encryptMessage } from '../utils/crypto';

export default function ChatPage({ socket, cryptoKey, roomId, messages, setMessages, isConnected, handleLeave }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
