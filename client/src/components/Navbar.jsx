import React from 'react';

export default function Navbar({ currentView, setCurrentView, isConnected }) {
  return (
    <nav className="navbar">
      <div 
        className="nav-brand" 
        style={{ cursor: 'pointer' }}
        onClick={() => setCurrentView('voter')}
      >
        <span className="nav-brand-dot" />
        <span style={{ fontWeight: 600 }}>vote</span>
      </div>

      <div className="nav-links">
        <div className="status-pill">
          <span 
            className="status-dot" 
            style={{ backgroundColor: isConnected ? 'var(--accent-green)' : '#f59e0b' }} 
          />
          <span>{isConnected ? 'live' : 'connecting'}</span>
        </div>

        <button
          className={`nav-btn ${currentView === 'voter' ? 'active' : ''}`}
          onClick={() => setCurrentView('voter')}
          id="nav-home-btn"
        >
          poll
        </button>

        <button
          className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentView('admin')}
          id="nav-admin-btn"
        >
          /admin
        </button>
      </div>
    </nav>
  );
}
