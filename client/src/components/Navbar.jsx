import React from 'react';

export default function Navbar({ currentView, setCurrentView, isConnected }) {
  return (
    <nav className="navbar">
      <div 
        className="nav-brand" 
        style={{ cursor: 'pointer' }}
        onClick={() => setCurrentView('voter')}
      >
        <img 
          src="/logo.png" 
          alt="DVOTE logo" 
          style={{ width: 26, height: 26, objectFit: 'contain' }} 
        />
        <span style={{ fontWeight: 700, letterSpacing: '0.05em', fontSize: '1.05rem' }}>
          DVOTE
        </span>
      </div>

      <div className="nav-links">
        <div className="status-pill">
          <span 
            className="status-dot" 
            style={{ backgroundColor: isConnected ? 'var(--accent-green)' : '#f59e0b' }} 
          />
          <span>{isConnected ? 'live' : 'connecting'}</span>
        </div>

        {/* Only show 'vote' link if currently inside admin console */}
        {currentView === 'admin' && (
          <button
            className="nav-btn"
            onClick={() => setCurrentView('voter')}
            id="nav-home-btn"
          >
            ← vote
          </button>
        )}
      </div>
    </nav>
  );
}
