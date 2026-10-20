import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import CountdownTimer from './CountdownTimer';
import VoteOptionCard from './VoteOptionCard';
import { playVoteSuccessSound, playPollEndedSound } from '../utils/sound';
import { Zap, Clock, ShieldCheck, Trophy, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function VoterView({
  activePoll,
  voterId,
  hasVoted,
  votedChoice,
  onVote,
  onPollExpired,
  onSwitchToAdmin
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

      // Launch celebratory particle confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: choice === 'option_a' ? ['#06b6d4', '#3b82f6', '#ffffff'] : ['#ec4899', '#f43f5e', '#ffffff']
      });
    } catch (err) {
      setVoteError(err.message || 'Failed to submit vote');
    } finally {
      setVotingInProgress(false);
    }
  };

  // If no poll has ever been created or no active poll exists
  if (!activePoll) {
    return (
      <div style={{ maxWidth: 720, margin: '2.5rem auto', width: '100%' }}>
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div 
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Clock size={34} color="#a5b4fc" />
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
            No Active Poll Right Now
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 2rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Standing by for the admin to broadcast a new poll! When a poll is created, this screen will instantly spring to life via Socket.IO.
          </p>

          <button 
            className="btn-primary" 
            onClick={onSwitchToAdmin}
            id="go-admin-cta"
          >
            Go to Admin Console & Launch Poll <ArrowRight size={18} />
          </button>

          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="tech-callout" style={{ justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#818cf8" />
              <span>Real-time Socket.IO listener active • PostgreSQL atomic concurrency enabled</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEnded = activePoll.status === 'ended' || (activePoll.remaining_seconds <= 0 && activePoll.status !== 'active');
  const totalVotes = (activePoll.option_a_votes || 0) + (activePoll.option_b_votes || 0);

  // Winner determination
  let winner = null;
  if (isEnded && totalVotes > 0) {
    if (activePoll.option_a_votes > activePoll.option_b_votes) {
      winner = 'option_a';
    } else if (activePoll.option_b_votes > activePoll.option_a_votes) {
      winner = 'option_b';
    } else {
      winner = 'tie';
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '1.5rem auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Active Poll Main Card */}
      <div className="glass-card" style={{ padding: '2rem 2.25rem' }}>
        
        {/* Status Header & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isEnded ? (
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 999,
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                🏁 Poll Concluded
              </span>
            ) : (
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 999,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <span className="status-dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
                Live Voting
              </span>
            )}

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Poll #{activePoll.id} • {activePoll.duration_seconds}s
            </span>
          </div>

          <CountdownTimer 
            expiresAt={activePoll.expires_at}
            totalDuration={activePoll.duration_seconds}
            onExpire={onPollExpired}
          />
        </div>

        {/* Question Title */}
        <h1 style={{ fontSize: '2.1rem', marginBottom: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {activePoll.question}
        </h1>

        {/* Winner Banner if ended */}
        {isEnded && (
          <div 
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Trophy size={24} color="#fbbf24" />
              <div>
                <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1rem' }}>
                  {winner === 'tie' 
                    ? "It's a Dead Heat Tie! 🤝" 
                    : winner === 'option_a' 
                      ? `Winner: "${activePoll.option_a}" 🏆` 
                      : `Winner: "${activePoll.option_b}" 🏆`}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(251, 191, 36, 0.8)' }}>
                  Total of {totalVotes} votes verified by PostgreSQL
                </div>
              </div>
            </div>

            <button
              className="btn-secondary"
              onClick={onSwitchToAdmin}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              Start New Poll
            </button>
          </div>
        )}

        {/* Notification when voter already voted */}
        {hasVoted && (
          <div 
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.5rem'
            }}
          >
            <ShieldCheck size={20} />
            <span>
              Your vote for <strong>{votedChoice === 'option_a' ? activePoll.option_a : activePoll.option_b}</strong> has been atomically recorded on PostgreSQL! Each person may vote only once.
            </span>
          </div>
        )}

        {voteError && (
          <div 
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={20} />
            <span>{voteError}</span>
          </div>
        )}

        {/* Voting Options (A vs B) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          <VoteOptionCard
            type="option_a"
            title={activePoll.option_a}
            votes={activePoll.option_a_votes || 0}
            totalVotes={totalVotes}
            isSelected={votedChoice === 'option_a'}
            isDisabled={hasVoted || isEnded || votingInProgress}
            isEnded={isEnded}
            isWinner={winner === 'option_a'}
            onVote={handleVoteClick}
          />

          <VoteOptionCard
            type="option_b"
            title={activePoll.option_b}
            votes={activePoll.option_b_votes || 0}
            totalVotes={totalVotes}
            isSelected={votedChoice === 'option_b'}
            isDisabled={hasVoted || isEnded || votingInProgress}
            isEnded={isEnded}
            isWinner={winner === 'option_b'}
            onVote={handleVoteClick}
          />
        </div>

        {/* Card Footer Info */}
        <div 
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="#818cf8" />
            <span>Live updates via Socket.IO • Total votes: <strong style={{ color: 'var(--text-primary)' }}>{totalVotes}</strong></span>
          </div>

          <div>
            Voter ID: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{voterId ? voterId.substring(0, 14) + '...' : 'Anonymous'}</code>
          </div>
        </div>

      </div>

      {/* Under-Card Architecture Explainer */}
      <div className="tech-callout">
        <ShieldCheck size={22} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#e0e7ff', marginBottom: '0.2rem' }}>
            PostgreSQL Atomic Guarantee & Unique Constraint
          </div>
          <div>
            Every ballot is processed inside PostgreSQL with an atomic Common Table Expression (CTE) increment (<code>option_x_votes = option_x_votes + 1</code>) paired with a <code>UNIQUE(poll_id, voter_id)</code> constraint. No duplicate votes or race condition overcounts are mathematically possible.
          </div>
        </div>
      </div>

    </div>
  );
}
