import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import VoteOptionCard from './VoteOptionCard';
import { playVoteSuccessSound } from '../utils/sound';

export default function VoterView({
  activePoll,
  hasVoted,
  votedChoice,
  onVote,
  onPollExpired
}) {
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [voteError, setVoteError] = useState(null);

  const handleVoteClick = async (choice) => {
    if (hasVoted || votingInProgress || !activePoll || activePoll.status === 'ended') {
      return;
    }

    setVotingInProgress(true);
    setVoteError(null);

    try {
      await onVote(activePoll.id, choice);
      playVoteSuccessSound();
    } catch (err) {
      setVoteError(err.message || 'Failed to submit vote');
    } finally {
      setVotingInProgress(false);
    }
  };

  // If no live poll or poll has expired, show clean waiting state with loading bar
  const isExpired = !activePoll || activePoll.status === 'ended' || (activePoll.remaining_seconds <= 0 && activePoll.status !== 'active');

  if (isExpired) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <img 
          src="/logo.png" 
          alt="DVOTE" 
          style={{ width: 48, height: 48, marginBottom: '1.25rem', opacity: 0.9 }} 
        />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Poll is about to come
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          waiting for the next live question...
        </p>

        {/* Indeterminate minimalist loading bar */}
        <div className="loading-bar-track">
          <div className="loading-bar-indicator" />
        </div>
      </div>
    );
  }

  const totalVotes = (activePoll.option_a_votes || 0) + (activePoll.option_b_votes || 0);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Poll Header: Timer and Question */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ● live
          </span>

          <CountdownTimer 
            expiresAt={activePoll.expires_at}
            onExpire={onPollExpired}
          />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.35 }}>
          {activePoll.question}
        </h1>
      </div>

      {voteError && (
        <div 
          style={{
            padding: '0.65rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.85rem'
          }}
        >
          {voteError}
        </div>
      )}

      {/* Voting Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <VoteOptionCard
          type="option_a"
          title={activePoll.option_a}
          votes={activePoll.option_a_votes || 0}
          totalVotes={totalVotes}
          isSelected={votedChoice === 'option_a'}
          isDisabled={hasVoted || votingInProgress}
          onVote={handleVoteClick}
        />

        <VoteOptionCard
          type="option_b"
          title={activePoll.option_b}
          votes={activePoll.option_b_votes || 0}
          totalVotes={totalVotes}
          isSelected={votedChoice === 'option_b'}
          isDisabled={hasVoted || votingInProgress}
          onVote={handleVoteClick}
        />
      </div>

      {hasVoted && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          vote submitted. results will vanish when the timer ends.
        </div>
      )}

    </div>
  );
}
