import { Shield, PlusCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HomeSelection.css';

export default function HomeSelection() {
  const navigate = useNavigate();

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
        <div className="action-card primary-card" onClick={() => navigate('/start')}>
          <div className="card-icon-wrapper">
            <PlusCircle size={32} />
          </div>
          <h2>Start New Chat</h2>
          <p>Generate a secure room and get a QR code to invite your peer.</p>
        </div>

        <div className="action-card secondary-card" onClick={() => navigate('/join')}>
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
