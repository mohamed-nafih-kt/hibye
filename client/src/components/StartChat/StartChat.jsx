import { useState, useEffect } from 'react';
import { Shield, Lock, Copy, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import './StartChat.css';

export default function StartChat({ onJoin }) {
  const navigate = useNavigate();
  const [newChatDetails, setNewChatDetails] = useState({ id: '', password: '' });

  useEffect(() => {
    // Generate relatively strong ID on mount
    const generateSegment = () => Math.random().toString(36).substring(2, 10);
    const randomId = generateSegment() + '-' + generateSegment();
    setNewChatDetails({ id: randomId, password: '' });
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleStart = () => {
    if (newChatDetails.password.trim()) {
      onJoin(newChatDetails.id, newChatDetails.password);
      navigate('/chat');
    }
  };

  const qrPayload = newChatDetails.id;

  return (
    <div className="glass-panel anim-slide">
      <button className="back-btn" onClick={() => navigate('/')}>&larr; Back</button>
      <div className="panel-header">
        <Shield size={32} className="text-primary" />
        <h2>Your Secure Room</h2>
      </div>

      <div className="room-details-container">
        <div className="qr-container">
          <div className="qr-box" style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
             {qrPayload ? (
              <QRCode 
                value={qrPayload} 
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="Q"
              />
             ) : <div style={{ width: 180, height: 180 }} />}
          </div>
          <p className="qr-hint">Have your peer scan this to get the Chat ID</p>
        </div>

        <div className="credentials-box">
          <div className="credential-row">
            <label>Chat ID</label>
            <div className="copyable-field" onClick={() => copyToClipboard(newChatDetails.id)}>
              <span>{newChatDetails.id}</span>
              <Copy size={16} />
            </div>
          </div>
          <div className="credential-row">
            <label>Set your Password</label>
            <div className="input-wrapper" style={{ marginTop: '0.25rem' }}>
             <Lock size={18} className="input-icon" />
             <input 
              id="startPassword"
              type="password" 
              placeholder="Choose a strong password" 
              value={newChatDetails.password}
              onChange={(e) => setNewChatDetails({...newChatDetails, password: e.target.value})}
             />
            </div>
          </div>
        </div>
      </div>

      <div className="info-box">
        <Info size={16} />
        <span>Keep this window open. The session begins when your peer joins with the same Password.</span>
      </div>

      <button 
        className="btn-primary" 
        disabled={!newChatDetails.password.trim()}
        onClick={handleStart}
        style={{ marginTop: '1.5rem', width: '100%', opacity: newChatDetails.password.trim() ? 1 : 0.5 }}
      >
        Enter Room
      </button>
    </div>
  );
}
