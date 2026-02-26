import { useState } from 'react';
import { Shield, Lock, User, PlusCircle, LogIn, Camera, Copy, Info } from 'lucide-react';
import QRCode from 'react-qr-code';
import QRScanner from './QRScanner';

export default function Home({ onJoin }) {
  const [mode, setMode] = useState('selection'); // 'selection', 'start', 'join'
  
  // Start Chat State
  const [newChatDetails, setNewChatDetails] = useState(null);
  
  // Join Chat State
  const [joinId, setJoinId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const generateSecureChat = () => {
    // Generate relatively strong ID and extremely strong password
    const generateSegment = () => Math.random().toString(36).substring(2, 10);
    const randomId = generateSegment() + '-' + generateSegment();
    const randomPass = generateSegment() + generateSegment() + generateSegment();
    
    setNewChatDetails({ id: randomId, password: randomPass });
    setMode('start');
  };

  const handleManualJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!joinId.trim() || !joinPassword.trim()) {
      setError('Chat ID and Password are required.');
      return;
    }
    onJoin(joinId, joinPassword);
  };

  const handleQRScanSuccess = (decodedText) => {
    setIsScanning(false);
    try {
      const data = JSON.parse(decodedText);
      if (data.i && data.p) {
        onJoin(data.i, data.p);
      } else {
        setError("Invalid QR format. Could not find room credentials.");
      }
    } catch {
      setError("Unrecognized QR Code.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Render the initial selection cards
  if (mode === 'selection') {
    return (
      <div className="home-container anim-fade">
        <div className="home-header">
          <div className="logo-container">
            <Shield size={56} className="text-primary glow" />
          </div>
          <h1>Secure<span>Chat</span></h1>
          <p>End-to-end encrypted, zero-knowledge ephemeral messaging.</p>
        </div>

        <div className="cards-grid">
          <div className="action-card primary-card" onClick={generateSecureChat}>
            <div className="card-icon-wrapper">
              <PlusCircle size={32} />
            </div>
            <h2>Start New Chat</h2>
            <p>Generate a secure room and get a QR code to invite your peer.</p>
          </div>

          <div className="action-card secondary-card" onClick={() => setMode('join')}>
            <div className="card-icon-wrapper">
              <LogIn size={32} />
            </div>
            <h2>Join a Chat</h2>
            <p>Enter an existing Chat ID or scan a QR code from your peer.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render "Start New Chat" screen
  if (mode === 'start') {
    const qrPayload = JSON.stringify({ i: newChatDetails.id, p: newChatDetails.password });
    
    return (
      <div className="glass-panel anim-slide">
        <button className="back-btn" onClick={() => setMode('selection')}>&larr; Back</button>
        <div className="panel-header">
          <Shield size={32} className="text-primary" />
          <h2>Your Secure Room</h2>
        </div>

        <div className="room-details-container">
          <div className="qr-container">
            <div className="qr-box">
              <QRCode 
                value={qrPayload} 
                size={180}
                bgColor="transparent"
                fgColor="var(--text-main)"
                level="Q"
              />
            </div>
            <p className="qr-hint">Have your peer scan this code</p>
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
              <label>Password</label>
              <div className="copyable-field" onClick={() => copyToClipboard(newChatDetails.password)}>
                <span>{newChatDetails.password}</span>
                <Copy size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="info-box">
          <Info size={16} />
          <span>Keep this window open. The session begins when your peer joins.</span>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => onJoin(newChatDetails.id, newChatDetails.password)}
          style={{ marginTop: '1.5rem', width: '100%' }}
        >
          Enter Room
        </button>
      </div>
    );
  }

  // Render "Join a Chat" screen
  if (mode === 'join') {
    return (
      <div className="glass-panel anim-slide">
        <button className="back-btn" onClick={() => { setMode('selection'); setIsScanning(false); setError(''); }}>&larr; Back</button>
        <div className="panel-header">
          <LogIn size={32} className="text-primary" />
          <h2>Join Room</h2>
        </div>

        {!isScanning ? (
          <>
            <button className="btn-secondary scan-btn" onClick={() => setIsScanning(true)}>
              <Camera size={20} />
              Scan QR Code
            </button>
            
            <div className="divider">
              <span>OR ENTER MANUALLY</span>
            </div>

            <form onSubmit={handleManualJoin} className="join-form">
              <div className="form-group">
                <label htmlFor="joinId">Chat ID</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    id="joinId"
                    type="text" 
                    placeholder="Enter Session ID" 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="joinPassword">Decryption Key (Password)</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    id="joinPassword"
                    type="password" 
                    placeholder="Enter Password" 
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                Join Secure Session
              </button>
            </form>
          </>
        ) : (
          <div className="scanner-section">
            <QRScanner 
              onScanSuccess={handleQRScanSuccess} 
              onScanFailure={(err) => { /* optionally handle errors softly */ }}
            />
            {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
            <button className="btn-text" onClick={() => setIsScanning(false)}>
              Cancel Scanning
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
