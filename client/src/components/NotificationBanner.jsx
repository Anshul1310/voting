import React, { useEffect, useState } from 'react';
import { Zap, X, ArrowRight } from 'lucide-react';

export default function NotificationBanner({ poll, onDismiss, onVoteNow }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !poll) return null;

  return (
    <div 
      className="new-poll-toast"
      onClick={onVoteNow}
      role="alert"
    >
      <div 
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)'
        }}
      >
        <Zap size={18} fill="white" color="white" />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fbbf24' }}>
            NEW LIVE POLL!
          </span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.1rem 0.5rem', borderRadius: 999 }}>
            {poll.duration_seconds}s Blitz
          </span>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 600, maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {poll.question}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVoteNow();
          }}
          className="btn-primary"
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderRadius: 999 }}
        >
          Vote <ArrowRight size={14} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            if (onDismiss) onDismiss();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'flex'
          }}
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
