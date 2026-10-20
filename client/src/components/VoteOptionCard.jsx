import React from 'react';
import { CheckCircle2, Trophy, BarChart3 } from 'lucide-react';

export default function VoteOptionCard({
  type, // 'option_a' or 'option_b'
  title,
  votes,
  totalVotes,
  isSelected,
  isDisabled,
  isEnded,
  isWinner,
  onVote
}) {
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const isA = type === 'option_a';
  const label = isA ? 'A' : 'B';

  return (
    <button
      className={`vote-option-btn ${isA ? 'option-a' : 'option-b'} ${isSelected ? 'selected' : ''}`}
      onClick={() => onVote(type)}
      disabled={isDisabled}
      id={`vote-btn-${type}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              background: isA 
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)' 
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(244, 63, 94, 0.25) 100%)',
              border: `1px solid ${isA ? 'rgba(6, 182, 212, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
              color: isA ? '#38bdf8' : '#fb7185'
            }}
          >
            {label}
          </div>

          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isDisabled ? 'Total counted votes' : 'Click to cast your vote'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          {isWinner && (
            <div className="winner-badge" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
              <Trophy size={13} /> Winner
            </div>
          )}

          {isSelected && (
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: isA ? '#38bdf8' : '#fb7185',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={16} /> You Voted
            </div>
          )}

          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {percentage}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {votes} {votes === 1 ? 'vote' : 'votes'}
          </div>
        </div>
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="vote-progress-track">
        <div 
          className={`vote-progress-fill ${isA ? 'fill-a' : 'fill-b'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}
