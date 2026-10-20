import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import VoterView from './components/VoterView';
import AdminView from './components/AdminView';
import NotificationBanner from './components/NotificationBanner';
import socket from './utils/socket';
import { getOrCreateVoterId, saveLocalVote, getLocalVote } from './utils/voterId';
import { playNewPollSound, playPollEndedSound } from './utils/sound';

export default function App() {
  // Navigation: 'voter' (/) or 'admin' (/admin)
  const [currentView, setCurrentView] = useState(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'voter';
  });

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [voterId] = useState(() => getOrCreateVoterId());
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState(null);
  const [newPollNotification, setNewPollNotification] = useState(null);

  // Sync URL bar with view state
  const handleViewChange = (view) => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(window.location.pathname.startsWith('/admin') ? 'admin' : 'voter');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update voted status for a given poll
  const syncVotedStatus = useCallback((poll) => {
    if (!poll) {
      setHasVoted(false);
      setVotedChoice(null);
      return;
    }

    // Check DB response if user voted
    if (poll.user_voted) {
      setHasVoted(true);
      setVotedChoice(poll.user_voted.choice);
      saveLocalVote(poll.id, poll.user_voted.choice);
      return;
    }

    // Check localStorage fallback
    const local = getLocalVote(poll.id);
    if (local) {
      setHasVoted(true);
      setVotedChoice(local.choice);
    } else {
      setHasVoted(false);
      setVotedChoice(null);
    }
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    const onConnect = () => {
      console.log('⚡ Socket connected to server');
      setIsConnected(true);
      socket.emit('request_active_poll', { voterId });
    };

    const onDisconnect = () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    };

    const onActivePollData = ({ poll }) => {
      setActivePoll(poll);
      syncVotedStatus(poll);
    };

    const onNewPoll = ({ poll }) => {
      console.log('📢 New poll broadcast received:', poll);
      setActivePoll(poll);
      setHasVoted(false);
      setVotedChoice(null);
      setNewPollNotification(poll);
      playNewPollSound();
    };

    const onVoteUpdate = ({ pollId, option_a_votes, option_b_votes }) => {
      setActivePoll((prev) => {
        if (!prev || prev.id !== pollId) return prev;
        return {
          ...prev,
          option_a_votes,
          option_b_votes
        };
      });
    };

    const onPollEnded = ({ poll }) => {
      console.log('🏁 Poll ended event received:', poll);
      setActivePoll((prev) => {
        if (!prev || prev.id !== poll.id) return prev;
        return {
          ...prev,
          ...poll,
          status: 'ended'
        };
      });
      playPollEndedSound();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('active_poll_data', onActivePollData);
    socket.on('new_poll', onNewPoll);
    socket.on('vote_update', onVoteUpdate);
    socket.on('poll_ended', onPollEnded);

    // Initial check
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('active_poll_data', onActivePollData);
      socket.off('new_poll', onNewPoll);
      socket.off('vote_update', onVoteUpdate);
      socket.off('poll_ended', onPollEnded);
    };
  }, [voterId, syncVotedStatus]);

  // Cast vote handler (REST API + fallback to Socket)
  const handleVote = async (pollId, choice) => {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId, choice })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.votedChoice) {
        setHasVoted(true);
        setVotedChoice(data.votedChoice);
        saveLocalVote(pollId, data.votedChoice);
      }
      throw new Error(data.error || 'Failed to submit vote');
    }

    // Success
    setHasVoted(true);
    setVotedChoice(choice);
    saveLocalVote(pollId, choice);
    setActivePoll(data.poll);
  };

  // Poll expiry callback from timer
  const handlePollExpired = () => {
    setActivePoll((prev) => {
      if (!prev || prev.status === 'ended') return prev;
      return { ...prev, status: 'ended' };
    });
  };

  // Admin force end poll
  const handleForceEndPoll = async (pollId) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/end`, { method: 'POST' });
      const data = await res.json();
      if (data.poll) {
        setActivePoll(data.poll);
      }
    } catch (err) {
      console.error('Failed to end poll', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Real-time Notification Banner for New Poll */}
      <NotificationBanner
        poll={newPollNotification}
        onDismiss={() => setNewPollNotification(null)}
        onVoteNow={() => {
          setNewPollNotification(null);
          handleViewChange('voter');
        }}
      />

      {/* Main Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleViewChange}
        isConnected={isConnected}
      />

      {/* Application Body */}
      <main className="app-container">
        {currentView === 'voter' ? (
          <VoterView
            activePoll={activePoll}
            voterId={voterId}
            hasVoted={hasVoted}
            votedChoice={votedChoice}
            onVote={handleVote}
            onPollExpired={handlePollExpired}
            onSwitchToAdmin={() => handleViewChange('admin')}
          />
        ) : (
          <AdminView
            activePoll={activePoll}
            onPollCreated={(newPoll) => {
              setActivePoll(newPoll);
              setHasVoted(false);
              setVotedChoice(null);
            }}
            onForceEndPoll={handleForceEndPoll}
            onSwitchToVoter={() => handleViewChange('voter')}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        PulseVote &bull; Powered by React Vite, Node.js Socket.IO &amp; PostgreSQL Atomic Increment in Docker
      </footer>
    </div>
  );
}
