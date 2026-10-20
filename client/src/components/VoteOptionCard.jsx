import React from 'react';
import { Check } from 'lucide-react';

export default function VoteOptionCard({
  type,
  title,
  isSelected,
  isDisabled,
  onVote
}) {
  const isA = type === 'option_a';
  const label = isA ? 'A' : 'B';

  return (
    <button
      className={`vote-option-btn ${isSelected ? 'selected' : ''}`}
      onClick={() => onVote(type)}
      disabled={isDisabled}
      id={`vote-btn-${type}`}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.4rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <span 
          style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.9rem', 
            color: isSelected ? 'var(--accent-green)' : 'var(--text-muted)',
            fontWeight: 600,
            width: 22
          }}
        >
          {label}.
        </span>

        <span style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {title}
        </span>
      </div>

      <div>
        {isSelected ? (
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              color: 'var(--accent-green)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Check size={15} /> voted
          </span>
        ) : (
          <span 
            style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              fontFamily: 'var(--font-mono)',
              opacity: isDisabled ? 0.4 : 0.7 
            }}
          >
            {isDisabled ? '' : 'select'}
          </span>
        )}
      </div>
    </button>
  );
}
