import React from 'react';
import { Check } from 'lucide-react';

export default function VoteOptionCard({
  type,
  title,
  votes,
  totalVotes,
  isSelected,
  isDisabled,
  onVote
}) {
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const isA = type === 'option_a';
  const label = isA ? 'A' : 'B';

  return (
    <button
      className={`vote-option-btn ${isSelected ? 'selected' : ''}`}
      onClick={() => onVote(type)}
      disabled={isDisabled}
      id={`vote-btn-${type}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.85rem', 
              color: 'var(--text-muted)',
              width: 20
            }}
          >
            {label}.
          </span>

          <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isSelected && (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--accent-green)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Check size={14} /> voted
            </span>
          )}

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {percentage}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
              ({votes})
            </span>
          </div>
        </div>
      </div>

      <div className="vote-progress-track">
        <div
          className="vote-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}
