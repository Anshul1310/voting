import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Clock, 
  Trash2, 
  BarChart2, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Database, 
  Zap, 
  StopCircle,
  Eye,
  Trophy
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const PRESETS = [
  {
    question: 'Tabs or Spaces for indentation?',
    a: 'Tabs (Cleaner)',
    b: 'Spaces (Predictable)',
    duration: 15
  },
  {
    question: 'Next.js vs Vite for modern React web apps?',
    a: 'Vite ⚡',
    b: 'Next.js 🚀',
    duration: 15
  },
  {
    question: 'Would you rather have unlimited free coffee or unlimited high-speed fiber internet?',
    a: 'Unlimited Coffee ☕',
    b: 'Unlimited Fiber 🌐',
    duration: 10
  },
  {
    question: 'Which database engine do you trust most in production?',
    a: 'PostgreSQL 🐘',
    b: 'MongoDB 🍃',
    duration: 30
  }
];

export default function AdminView({ activePoll, onPollCreated, onForceEndPoll, onSwitchToVoter }) {
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch all polls history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/polls');
      const data = await res.json();
      if (data.polls) {
        setHistory(data.polls);
      }
    } catch (err) {
      console.error('Failed to load polls history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activePoll]);

  const applyPreset = (preset) => {
    setQuestion(preset.question);
    setOptionA(preset.a);
    setOptionB(preset.b);
    setDuration(preset.duration);
    setCustomDuration('');
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setFeedback({ type: 'error', message: 'Question cannot be blank.' });
      return;
    }
    if (!optionA.trim() || !optionB.trim()) {
      setFeedback({ type: 'error', message: 'Both Option 1 and Option 2 are required.' });
      return;
    }

    const finalDuration = customDuration ? parseInt(customDuration, 10) : duration;
    if (!finalDuration || finalDuration <= 0) {
      setFeedback({ type: 'error', message: 'Please specify a valid duration in seconds.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          option_a: optionA.trim(),
          option_b: optionB.trim(),
          duration_seconds: finalDuration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      setFeedback({
        type: 'success',
        message: `Poll created! Active for ${finalDuration} seconds. All connected users were notified via Socket.IO.`
      });

      if (onPollCreated) onPollCreated(data.poll);

      // Reset form
      setQuestion('');
      setOptionA('');
      setOptionB('');
      fetchHistory();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!confirm(`Are you sure you want to delete Poll #${pollId}?`)) return;
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((p) => p.id !== pollId));
      }
    } catch (err) {
      console.error('Failed to delete poll', err);
    }
  };

  const isLive = activePoll && activePoll.status === 'active' && activePoll.remaining_seconds > 0;
  const liveTotalVotes = isLive ? (activePoll.option_a_votes || 0) + (activePoll.option_b_votes || 0) : 0;

  return (
    <div style={{ maxWidth: 960, margin: '1.5rem auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header with Title and DB Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', fontWeight: 700 }}>
              Administration Console
            </span>
            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', padding: '0.15rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 }}>
              Endpoint: /admin
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>Manage & Broadcast Polls</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onSwitchToVoter} id="view-as-voter-btn">
            <Eye size={16} /> View as Voter
          </button>
        </div>
      </div>

      {/* Live Monitor Card (if active) */}
      {isLive && (
        <div 
          className="glass-card" 
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, rgba(20, 24, 45, 0.85) 0%, rgba(30, 27, 75, 0.85) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="status-dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
              <span style={{ fontWeight: 800, color: '#f87171', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                Currently Broadcasting Live
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Poll #{activePoll.id}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <CountdownTimer 
                expiresAt={activePoll.expires_at}
                totalDuration={activePoll.duration_seconds}
              />

              <button
                className="btn-secondary"
                onClick={() => onForceEndPoll(activePoll.id)}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                id="force-end-btn"
              >
                <StopCircle size={15} /> Force End
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
            {activePoll.question}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>Option A</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.2rem 0 0.5rem' }}>{activePoll.option_a}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {activePoll.option_a_votes || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>votes ({liveTotalVotes > 0 ? Math.round(((activePoll.option_a_votes || 0) / liveTotalVotes) * 100) : 0}%)</span>
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 600 }}>Option B</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.2rem 0 0.5rem' }}>{activePoll.option_b}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {activePoll.option_b_votes || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>votes ({liveTotalVotes > 0 ? Math.round(((activePoll.option_b_votes || 0) / liveTotalVotes) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Poll Creation Card */}
      <div className="glass-card" style={{ padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Sparkles size={20} color="#818cf8" />
          <h2 style={{ fontSize: '1.5rem' }}>Create & Launch a New Poll</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
          Configure a two-answer poll with a 10s, 15s, or 30s timer. Connected voter screens will immediately ring with a live notification via Socket.IO.
        </p>

        {/* Preset Suggestions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            ⚡ Instant Preset Ideas:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip"
                onClick={() => applyPreset(p)}
              >
                {p.question.length > 36 ? p.question.substring(0, 36) + '...' : p.question}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div 
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.5rem'
            }}
          >
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="poll-question">Poll Question</label>
            <input
              id="poll-question"
              className="form-input"
              type="text"
              placeholder="e.g., Which framework do you prefer for high-scale applications?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="poll-option-a">Answer 1 (Option A)</label>
              <input
                id="poll-option-a"
                className="form-input"
                type="text"
                placeholder="e.g., React Vite ⚡"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="poll-option-b">Answer 2 (Option B)</label>
              <input
                id="poll-option-b"
                className="form-input"
                type="text"
                placeholder="e.g., Next.js 🚀"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="input-group">
            <label className="input-label">Poll Duration</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`duration-chip ${duration === 10 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(10); setCustomDuration(''); }}
                id="duration-10s"
              >
                <Zap size={16} /> 10 Seconds (Blitz)
              </button>

              <button
                type="button"
                className={`duration-chip ${duration === 15 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(15); setCustomDuration(''); }}
                id="duration-15s"
              >
                <Clock size={16} /> 15 Seconds (Standard)
              </button>

              <button
                type="button"
                className={`duration-chip ${duration === 30 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(30); setCustomDuration(''); }}
                id="duration-30s"
              >
                <Clock size={16} /> 30 Seconds (Extended)
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Custom:</span>
                <input
                  type="number"
                  min="5"
                  max="300"
                  placeholder="Secs"
                  value={customDuration}
                  onChange={(e) => {
                    setCustomDuration(e.target.value);
                  }}
                  className="form-input"
                  style={{ width: '80px', padding: '0.5rem 0.6rem', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              id="broadcast-poll-btn"
              style={{ minWidth: 200 }}
            >
              <Zap size={18} fill="white" />
              {isSubmitting ? 'Broadcasting...' : 'Launch Live Poll 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* Tech Architecture Callout */}
      <div className="tech-callout">
        <Database size={24} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#e0e7ff', marginBottom: '0.2rem' }}>
            PostgreSQL Docker & Atomic Increment Engine
          </div>
          <div style={{ lineHeight: 1.6 }}>
            Polls run on a dedicated PostgreSQL 16 container. Vote mutations are performed using PostgreSQL CTEs: 
            <code> WITH new_vote AS (INSERT INTO votes ... ON CONFLICT DO NOTHING) UPDATE polls SET option_a_votes = option_a_votes + 1 ...</code>.
            This guarantees zero concurrency race conditions and restricts each voter token to a single vote.
          </div>
        </div>
      </div>

      {/* Past Polls History Table */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem' }}>Polls Archive & Audit</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Historical results recorded in PostgreSQL
            </p>
          </div>
          <button className="btn-secondary" onClick={fetchHistory} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            Refresh List
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading polls archive...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No polls have been conducted yet. Create your first poll above!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Question</th>
                  <th style={{ padding: '0.75rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem' }}>Option A</th>
                  <th style={{ padding: '0.75rem' }}>Option B</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => {
                  const total = (p.option_a_votes || 0) + (p.option_b_votes || 0);
                  const aWinner = p.option_a_votes > p.option_b_votes;
                  const bWinner = p.option_b_votes > p.option_a_votes;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        #{p.id}
                      </td>
                      <td style={{ padding: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.question}
                      </td>
                      <td style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                        {p.duration_seconds}s
                      </td>
                      <td style={{ padding: '0.85rem' }}>
                        <span style={{ color: aWinner ? '#38bdf8' : 'var(--text-secondary)', fontWeight: aWinner ? 700 : 400 }}>
                          {p.option_a} ({p.option_a_votes}) {aWinner && total > 0 ? '🏆' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem' }}>
                        <span style={{ color: bWinner ? '#fb7185' : 'var(--text-secondary)', fontWeight: bWinner ? 700 : 400 }}>
                          {p.option_b} ({p.option_b_votes}) {bWinner && total > 0 ? '🏆' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem' }}>
                        <span 
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 999,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: p.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                            color: p.status === 'active' ? '#f87171' : '#94a3b8'
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeletePoll(p.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            transition: 'color 0.2s'
                          }}
                          title="Delete Poll"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
