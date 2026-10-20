import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function NotificationBanner({ poll, onDismiss, onVoteNow }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !poll) return null;

  return (
    <div 
      className="new-poll-toast"
      onClick={onVoteNow}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>● live</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {poll.question}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVoteNow();
          }}
          className="btn-primary"
          style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
        >
          vote
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
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex'
          }}
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
