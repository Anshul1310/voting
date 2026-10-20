/**
 * Unique voter identifier and local vote tracking
 */
const STORAGE_KEY = 'pulsevote_voter_id';
const VOTED_POLLS_KEY = 'pulsevote_voted_polls';

export function getOrCreateVoterId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    // Generate UUID or fallback to timestamp + random string
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = 'voter_' + crypto.randomUUID();
    } else {
      id = 'voter_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function saveLocalVote(pollId, choice) {
  try {
    const raw = localStorage.getItem(VOTED_POLLS_KEY);
    const votes = raw ? JSON.parse(raw) : {};
    votes[pollId] = {
      choice,
      timestamp: Date.now()
    };
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(votes));
  } catch (err) {
    console.error('Failed to save local vote', err);
  }
}

export function getLocalVote(pollId) {
  try {
    const raw = localStorage.getItem(VOTED_POLLS_KEY);
    if (!raw) return null;
    const votes = JSON.parse(raw);
    return votes[pollId] || null;
  } catch (err) {
    return null;
  }
}
