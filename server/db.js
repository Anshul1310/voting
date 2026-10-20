import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/voting_db',
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    
    // Create polls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_a_votes INT NOT NULL DEFAULT 0,
        option_b_votes INT NOT NULL DEFAULT 0,
        duration_seconds INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active'
      );
    `);

    // Create votes table with UNIQUE(poll_id, voter_id) constraint
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        poll_id INT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        voter_id VARCHAR(255) NOT NULL,
        choice VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_poll_voter UNIQUE (poll_id, voter_id)
      );
    `);

    // Create index for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_poll_voter ON votes(poll_id, voter_id);
      CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
    `);

    console.log('✅ PostgreSQL tables and constraints initialized successfully.');
  } finally {
    client.release();
  }
}

/**
 * Creates a new poll
 */
export async function createPoll({ question, option_a, option_b, duration_seconds }) {
  const duration = parseInt(duration_seconds, 10) || 15;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Archive any currently active poll
    await client.query(`
      UPDATE polls 
      SET status = 'ended' 
      WHERE status = 'active'
    `);

    // Insert new poll with expires_at computed in PostgreSQL
    const res = await client.query(
      `
      INSERT INTO polls (question, option_a, option_b, duration_seconds, expires_at, status)
      VALUES ($1, $2, $3, $4::integer, NOW() + ($4::integer * INTERVAL '1 second'), 'active')
      RETURNING *, 
        EXTRACT(EPOCH FROM (expires_at - NOW()))::INT AS remaining_seconds,
        NOW() as server_now;
      `,
      [question, option_a, option_b, duration]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gets the current active poll (or latest poll if none is active)
 */
export async function getActivePoll(voterId = null) {
  // First auto-expire polls that passed their deadline
  await pool.query(`
    UPDATE polls 
    SET status = 'ended' 
    WHERE status = 'active' AND expires_at <= NOW()
  `);

  const res = await pool.query(`
    SELECT *, 
      GREATEST(0, EXTRACT(EPOCH FROM (expires_at - NOW()))::INT) AS remaining_seconds,
      NOW() as server_now
    FROM polls
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
  `);

  if (res.rows.length === 0) {
    // Return latest ended poll for reference/history preview
    const latestRes = await pool.query(`
      SELECT *, 
        0 AS remaining_seconds,
        NOW() as server_now
      FROM polls
      ORDER BY created_at DESC
      LIMIT 1;
    `);
    if (latestRes.rows.length === 0) return null;
    const poll = latestRes.rows[0];
    if (voterId) {
      poll.user_voted = await checkUserVoted(poll.id, voterId);
    }
    return poll;
  }

  const poll = res.rows[0];
  if (voterId) {
    poll.user_voted = await checkUserVoted(poll.id, voterId);
  }
  return poll;
}

/**
 * Check if a voter has already voted on a poll
 */
export async function checkUserVoted(pollId, voterId) {
  if (!voterId) return null;
  const res = await pool.query(
    `SELECT choice, created_at FROM votes WHERE poll_id = $1 AND voter_id = $2 LIMIT 1;`,
    [pollId, voterId]
  );
  return res.rows.length > 0 ? res.rows[0] : null;
}

/**
 * ATOMIC INCREMENT VOTE
 * Enforces:
 * 1. Anyone can vote ONLY ONCE per poll (via unique DB constraint + atomic CTE)
 * 2. Atomic in-place increment on PostgreSQL: option_x_votes = option_x_votes + 1
 * 3. Poll expiry enforcement directly in the atomic query
 */
export async function castVote({ pollId, voterId, choice }) {
  if (!['option_a', 'option_b'].includes(choice)) {
    throw new Error('Invalid choice. Must be option_a or option_b.');
  }

  // ATOMIC INSERT + ATOMIC INCREMENT IN POSTGRESQL (Executed in a SINGLE round-trip)
  // Using CTE:
  // 1. row is inserted into votes (with ON CONFLICT DO NOTHING enforcing single vote per voter)
  // 2. count in polls is atomically incremented by +1 using PostgreSQL row-level locks
  // 3. WHERE clause enforces p.expires_at > NOW() AND p.status = 'active'
  const atomicQuery = `
    WITH new_vote AS (
      INSERT INTO votes (poll_id, voter_id, choice)
      VALUES ($1, $2, $3)
      ON CONFLICT (poll_id, voter_id) DO NOTHING
      RETURNING poll_id, choice
    )
    UPDATE polls p
    SET 
      option_a_votes = CASE WHEN nv.choice = 'option_a' THEN p.option_a_votes + 1 ELSE p.option_a_votes END,
      option_b_votes = CASE WHEN nv.choice = 'option_b' THEN p.option_b_votes + 1 ELSE p.option_b_votes END
    FROM new_vote nv
    WHERE p.id = nv.poll_id
      AND p.expires_at > NOW()
      AND p.status = 'active'
    RETURNING p.*,
      GREATEST(0, EXTRACT(EPOCH FROM (p.expires_at - NOW()))::INT) AS remaining_seconds,
      NOW() as server_now;
  `;

  const result = await pool.query(atomicQuery, [pollId, voterId, choice]);

  // If a row was returned, the vote was successfully and atomically processed!
  if (result.rows.length > 0) {
    return {
      poll: result.rows[0],
      userVote: { choice, voterId }
    };
  }

  // If 0 rows were returned, diagnose the specific reason for clean client error reporting:
  // 1. Did the user already vote?
  const existingVote = await pool.query(
    `SELECT choice FROM votes WHERE poll_id = $1 AND voter_id = $2 LIMIT 1;`,
    [pollId, voterId]
  );
  if (existingVote.rows.length > 0) {
    const error = new Error('You have already voted on this poll! Only one vote is permitted.');
    error.status = 409;
    error.votedChoice = existingVote.rows[0].choice;
    throw error;
  }

  // 2. Has the poll expired or not found?
  const pollCheck = await pool.query(
    `SELECT id, status, expires_at, expires_at <= NOW() as is_expired FROM polls WHERE id = $1;`,
    [pollId]
  );
  if (pollCheck.rows.length === 0) {
    const error = new Error('Poll not found');
    error.status = 404;
    throw error;
  }

  if (pollCheck.rows[0].status === 'ended' || pollCheck.rows[0].is_expired) {
    await pool.query(`UPDATE polls SET status = 'ended' WHERE id = $1`, [pollId]);
    const error = new Error('Poll has already expired! Voting is closed.');
    error.status = 400;
    throw error;
  }

  const error = new Error('Voting closed or poll no longer active.');
  error.status = 400;
  throw error;
}

/**
 * End a poll explicitly
 */
export async function endPoll(pollId) {
  const res = await pool.query(
    `
    UPDATE polls 
    SET status = 'ended' 
    WHERE id = $1
    RETURNING *, 0 AS remaining_seconds, NOW() as server_now;
    `,
    [pollId]
  );
  return res.rows[0] || null;
}

/**
 * Get all polls for admin dashboard & statistics
 */
export async function getAllPolls() {
  const res = await pool.query(`
    SELECT p.*,
      (p.option_a_votes + p.option_b_votes) as total_votes,
      GREATEST(0, EXTRACT(EPOCH FROM (p.expires_at - NOW()))::INT) AS remaining_seconds,
      NOW() as server_now
    FROM polls p
    ORDER BY p.created_at DESC
    LIMIT 50;
  `);
  return res.rows;
}

/**
 * Delete a poll (admin action)
 */
export async function deletePoll(pollId) {
  await pool.query(`DELETE FROM polls WHERE id = $1;`, [pollId]);
  return true;
}

export default pool;
