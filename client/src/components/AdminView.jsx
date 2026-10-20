import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  StopCircle,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { BACKEND_URL } from '../utils/config';

const PRESETS = [
  { question: 'Tabs or Spaces for indentation?', a: 'Tabs', b: 'Spaces', duration: 15 },
  { question: 'Next.js vs Vite for modern React?', a: 'Vite', b: 'Next.js', duration: 15 },
  { question: 'Dark mode or Light mode by default?', a: 'Dark mode', b: 'Light mode', duration: 10 },
  { question: 'Coffee or Chai for late-night code?', a: 'Coffee', b: 'Chai', duration: 15 }
];

export default function AdminView({ activePoll, onPollCreated, onForceEndPoll, onSwitchToVoter }) {
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('pulsevote_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form state
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getAdminPassword = () => {
    return sessionStorage.getItem('pulsevote_admin_pw') || 'anshul';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('Enter password.');
      return;
    }

    setIsVerifying(true);
    setLoginError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect password.');
      }

      sessionStorage.setItem('pulsevote_admin_auth', 'true');
      sessionStorage.setItem('pulsevote_admin_pw', passwordInput.trim());
      setIsAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message || 'Incorrect password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pulsevote_admin_auth');
    sessionStorage.removeItem('pulsevote_admin_pw');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Fetch all polls history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/polls`);
      const data = await res.json();
      if (data.polls) {
        setHistory(data.polls);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [activePoll, isAuthenticated]);

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
      setFeedback({ type: 'error', message: 'Both Option A and Option B are required.' });
      return;
    }

    const finalDuration = customDuration ? parseInt(customDuration, 10) : duration;
    if (!finalDuration || finalDuration <= 0) {
      setFeedback({ type: 'error', message: 'Specify a valid duration in seconds.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/polls`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({
          question: question.trim(),
          option_a: optionA.trim(),
          option_b: optionB.trim(),
          duration_seconds: finalDuration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('pulsevote_admin_auth');
        }
        throw new Error(data.error || 'Failed to create poll');
      }

      setFeedback({
        type: 'success',
        message: `Poll published (${finalDuration}s). Live on all screens.`
      });

      if (onPollCreated) onPollCreated(data.poll);

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
    if (!confirm(`Delete Poll #${pollId}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/${pollId}`, { 
        method: 'DELETE',
        headers: {
          'x-admin-password': getAdminPassword()
        }
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((p) => p.id !== pollId));
      }
    } catch (err) {
      console.error('Failed to delete poll', err);
    }
  };

  // ----------------------------------------------------
  // Gated Password Protection Screen
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 360, margin: '4rem auto', width: '100%', padding: '0 1rem' }}>
        <div className="glass-card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
          
          <img 
            src="/logo.png" 
            alt="DVOTE" 
            style={{ width: 40, height: 40, marginBottom: '0.75rem', opacity: 0.9 }} 
          />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>
            Admin Login
          </h2>

          {loginError && (
            <div 
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isVerifying}
              style={{ width: '100%' }}
            >
              {isVerifying ? 'verifying...' : 'unlock'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button 
              className="btn-secondary" 
              onClick={onSwitchToVoter}
              style={{ fontSize: '0.8rem', width: '100%' }}
            >
              <ArrowLeft size={14} /> back to poll
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Authenticated Admin Dashboard
  // ----------------------------------------------------
  const isLive = activePoll && activePoll.status === 'active' && activePoll.remaining_seconds > 0;
  const liveTotalVotes = isLive ? (activePoll.option_a_votes || 0) + (activePoll.option_b_votes || 0) : 0;
  const liveAPercent = liveTotalVotes > 0 ? Math.round(((activePoll.option_a_votes || 0) / liveTotalVotes) * 100) : 0;
  const liveBPercent = liveTotalVotes > 0 ? Math.round(((activePoll.option_b_votes || 0) / liveTotalVotes) * 100) : 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="DVOTE" style={{ width: 22, height: 22 }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>DVOTE Admin</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={onSwitchToVoter} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            <ArrowLeft size={14} /> view poll
          </button>
          <button className="btn-secondary" onClick={handleLogout} title="Lock" style={{ padding: '0.35rem 0.65rem' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Live Monitor Card (if active) */}
      {isLive && (
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              ● live broadcasting
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CountdownTimer expiresAt={activePoll.expires_at} />
              <button
                className="btn-secondary"
                onClick={() => onForceEndPoll(activePoll.id)}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
              >
                <StopCircle size={13} /> end
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {activePoll.question}
          </h3>

          {/* Option A vs Option B Percentage Breakdown */}
          <div className="responsive-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Option A</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activePoll.option_a}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {liveAPercent}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({activePoll.option_a_votes || 0} votes)
                </span>
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Option B</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activePoll.option_b}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {liveBPercent}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ({activePoll.option_b_votes || 0} votes)
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            total responses: {liveTotalVotes}
          </div>
        </div>
      )}

      {/* Poll Creation Card */}
      <div className="glass-card" style={{ padding: '1.35rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Create Poll
        </h2>

        {/* Preset Suggestions */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip"
                onClick={() => applyPreset(p)}
              >
                {p.question}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div 
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: feedback.type === 'success' ? 'var(--accent-green-subtle)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? 'var(--accent-green)' : '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="poll-question">Question</label>
            <input
              id="poll-question"
              className="form-input"
              type="text"
              placeholder="e.g. Which tool do you use more?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div className="responsive-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="poll-option-a">Option A</label>
              <input
                id="poll-option-a"
                className="form-input"
                type="text"
                placeholder="Option A"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="poll-option-b">Option B</label>
              <input
                id="poll-option-b"
                className="form-input"
                type="text"
                placeholder="Option B"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="input-group">
            <label className="input-label">Duration</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`duration-chip ${duration === 10 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(10); setCustomDuration(''); }}
              >
                10s
              </button>

              <button
                type="button"
                className={`duration-chip ${duration === 15 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(15); setCustomDuration(''); }}
              >
                15s
              </button>

              <button
                type="button"
                className={`duration-chip ${duration === 30 && !customDuration ? 'active' : ''}`}
                onClick={() => { setDuration(30); setCustomDuration(''); }}
              >
                30s
              </button>

              <input
                type="number"
                min="5"
                max="300"
                placeholder="custom sec"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="form-input"
                style={{ width: '100px', padding: '0.4rem 0.6rem', textAlign: 'center', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'launching...' : 'launch poll'}
            </button>
          </div>
        </form>
      </div>

      {/* Past Polls Archive with Explicit Percentages */}
      <div className="glass-card" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Poll History & Percentages</h3>
          <button className="btn-secondary" onClick={fetchHistory} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
            refresh
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            loading...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
            no polls yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.25rem', fontFamily: 'var(--font-mono)', width: '35px' }}>#</th>
                  <th style={{ padding: '0.5rem' }}>Question</th>
                  <th style={{ padding: '0.5rem' }}>Option A &amp; %</th>
                  <th style={{ padding: '0.5rem' }}>Option B &amp; %</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => {
                  const total = (p.option_a_votes || 0) + (p.option_b_votes || 0);
                  const aPercent = total > 0 ? Math.round(((p.option_a_votes || 0) / total) * 100) : 0;
                  const bPercent = total > 0 ? Math.round(((p.option_b_votes || 0) / total) * 100) : 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.65rem 0.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {p.id}
                      </td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-primary)', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 500 }}>{p.question}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {total} {total === 1 ? 'vote' : 'votes'} total &bull; {p.duration_seconds}s
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                            {aPercent}%
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {p.option_a}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.option_a_votes || 0} votes
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                            {bPercent}%
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {p.option_b}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.option_b_votes || 0} votes
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeletePoll(p.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.2rem'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
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
