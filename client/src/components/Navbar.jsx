import React from 'react';
import { Zap, ShieldCheck, Home, Settings, Database } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, isConnected }) {
  return (
    <nav className="navbar">
      <div 
        className="nav-brand" 
        style={{ cursor: 'pointer' }}
        onClick={() => setCurrentView('voter')}
      >
        <div className="nav-brand-icon">
          <Zap size={22} fill="white" />
        </div>
        <div>
          <span className="gradient-brand" style={{ fontSize: '1.4rem' }}>PulseVote</span>
          <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
            ATOMIC REAL-TIME POLLS
          </span>
        </div>
      </div>

      <div className="nav-links">
        <div className="status-pill" title={isConnected ? 'Connected to live Socket.IO server' : 'Connecting to server...'}>
          <span 
            className="status-dot" 
            style={{ backgroundColor: isConnected ? '#10b981' : '#f59e0b', boxShadow: isConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }} 
          />
          <span>{isConnected ? 'Socket Live' : 'Connecting...'}</span>
        </div>

        <div 
          className="status-pill" 
          style={{ background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
          title="PostgreSQL 16 in Docker with Atomic Increment"
        >
          <Database size={13} />
          <span style={{ display: 'none', minWidth: '0' }} className="hide-sm">PG Docker</span>
          <span>Postgres Atomic</span>
        </div>

        <button
          className={`nav-btn ${currentView === 'voter' ? 'active' : ''}`}
          onClick={() => setCurrentView('voter')}
          id="nav-home-btn"
        >
          <Home size={17} />
          <span>Home</span>
        </button>

        <button
          className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentView('admin')}
          id="nav-admin-btn"
        >
          <Settings size={17} />
          <span>/admin</span>
        </button>
      </div>
    </nav>
  );
}
