import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initDb,
  createPoll,
  getActivePoll,
  castVote,
  endPoll,
  getAllPolls,
  deletePoll,
  checkUserVoted
} from './db.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*']
  }
});

// Fully open CORS to every origin for all routes and preflight requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// Additional middleware to guarantee Access-Control headers on every response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());


// In-memory active timer reference to auto-end polls
let activePollTimer = null;

function schedulePollExpiration(poll) {
  if (activePollTimer) {
    clearTimeout(activePollTimer);
    activePollTimer = null;
  }

  const remainingMs = Math.max(0, new Date(poll.expires_at).getTime() - Date.now());
  console.log(`⏱️ Scheduled poll #${poll.id} expiration in ${Math.round(remainingMs / 1000)}s`);

  activePollTimer = setTimeout(async () => {
    try {
      console.log(`🔔 Timer expired for poll #${poll.id}. Marking as ended...`);
      const ended = await endPoll(poll.id);
      if (ended) {
        io.emit('poll_ended', {
          poll: ended,
          reason: 'Timer expired'
        });
      }
    } catch (err) {
      console.error('Error auto-ending poll:', err);
    }
  }, remainingMs);
}

// ----------------------------------------------------
// Socket.io Real-time Event Handling
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  // Send current active poll state immediately
  socket.on('request_active_poll', async ({ voterId } = {}) => {
    try {
      const poll = await getActivePoll(voterId);
      socket.emit('active_poll_data', { poll });
    } catch (err) {
      console.error('Error fetching active poll on socket:', err);
      socket.emit('error_message', { message: 'Failed to load poll data.' });
    }
  });

  // Real-time vote event via socket (also supported via REST)
  socket.on('cast_vote', async ({ pollId, voterId, choice }) => {
    try {
      const { poll, userVote } = await castVote({ pollId, voterId, choice });

      // Notify the voter specifically of success
      socket.emit('vote_success', {
        pollId,
        userVote,
        poll
      });

      // Broadcast updated vote counts to ALL connected clients
      io.emit('vote_update', {
        pollId,
        option_a_votes: poll.option_a_votes,
        option_b_votes: poll.option_b_votes,
        total_votes: poll.option_a_votes + poll.option_b_votes
      });
    } catch (err) {
      console.error('Vote error:', err.message);
      socket.emit('vote_error', {
        message: err.message,
        votedChoice: err.votedChoice || null,
        status: err.status || 500
      });
    }
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const poll = await getActivePoll();
    res.json({
      status: 'ok',
      db: 'connected',
      activePollId: poll && poll.status === 'active' ? poll.id : null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Get active poll (with user voted status if voterId provided)
app.get('/api/polls/active', async (req, res) => {
  try {
    const { voterId } = req.query;
    const poll = await getActivePoll(voterId);
    res.json({ poll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin create new poll
app.post('/api/polls', async (req, res) => {
  try {
    const { question, option_a, option_b, duration_seconds } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }
    if (!option_a || !option_a.trim() || !option_b || !option_b.trim()) {
      return res.status(400).json({ error: 'Both Option 1 and Option 2 are required.' });
    }

    const duration = parseInt(duration_seconds, 10);
    if (!duration || duration <= 0) {
      return res.status(400).json({ error: 'Valid duration in seconds is required.' });
    }

    const newPoll = await createPoll({
      question: question.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      duration_seconds: duration
    });

    // Schedule timer to automatically close poll when expired
    schedulePollExpiration(newPoll);

    // Broadcast new poll to ALL connected users via Socket.IO
    io.emit('new_poll', {
      poll: newPoll,
      message: 'A new poll has launched! Cast your vote now!'
    });

    res.status(201).json({ poll: newPoll });
  } catch (err) {
    console.error('Error creating poll:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit vote (Atomic Increment in PostgreSQL)
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    const { voterId, choice } = req.body;

    if (!voterId) {
      return res.status(400).json({ error: 'Voter ID is required.' });
    }
    if (!choice || !['option_a', 'option_b'].includes(choice)) {
      return res.status(400).json({ error: 'Choice must be option_a or option_b.' });
    }

    const { poll, userVote } = await castVote({ pollId, voterId, choice });

    // Broadcast real-time update
    io.emit('vote_update', {
      pollId,
      option_a_votes: poll.option_a_votes,
      option_b_votes: poll.option_b_votes,
      total_votes: poll.option_a_votes + poll.option_b_votes
    });

    res.json({ success: true, poll, userVote });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message,
      votedChoice: err.votedChoice || null
    });
  }
});

// Admin force-end poll
app.post('/api/polls/:id/end', async (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    if (activePollTimer) {
      clearTimeout(activePollTimer);
      activePollTimer = null;
    }

    const endedPoll = await endPoll(pollId);
    if (endedPoll) {
      io.emit('poll_ended', {
        poll: endedPoll,
        reason: 'Poll ended by admin'
      });
    }

    res.json({ success: true, poll: endedPoll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin get all polls history
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await getAllPolls();
    res.json({ polls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete poll
app.delete('/api/polls/:id', async (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    await deletePoll(pollId);
    io.emit('poll_deleted', { pollId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
async function start() {
  try {
    await initDb();

    // Check if an existing active poll needs timer restoration
    const active = await getActivePoll();
    if (active && active.status === 'active' && active.remaining_seconds > 0) {
      schedulePollExpiration(active);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Voting Backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

start();
