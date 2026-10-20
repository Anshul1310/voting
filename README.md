# ⚡ PulseVote — Real-Time Atomic Polling Platform

PulseVote is a high-performance, real-time voting web application built with **React (Vite)**, **Node.js (Express + Socket.IO)**, and **PostgreSQL** running in **Docker**.

---

## 🌟 Key Features

1. **Admin Console (`/admin`)**:
   - Create 2-option polls instantly with customizable questions.
   - Built-in duration presets: **10 Seconds (Blitz)**, **15 Seconds (Standard)**, **30 Seconds (Extended)**, or custom second counts.
   - One-click idea presets (e.g., *Tabs vs Spaces*, *Vite vs Next.js*, *Node vs Bun*).
   - Live broadcast monitor with real-time percentage counters and a **Force End** control.
   - Complete poll history archive with vote breakdowns and delete actions.

2. **Real-Time Push Notifications (Socket.IO)**:
   - When an admin launches a new poll, all connected users on the home screen (`/`) immediately receive an animated top-banner alert with sound feedback (*Web Audio API* synthesized chimes).
   - Live countdown timer synchronized with PostgreSQL timestamps.
   - Live vote progress bars that smoothly animate in real-time as other users cast their ballots.

3. **Strict Single-Vote Enforcement**:
   - Each voter is identified by a persistent client token (`voterId`).
   - The PostgreSQL database enforces a strict `UNIQUE(poll_id, voter_id)` table constraint.
   - Attempting to vote more than once on the same poll is blocked at both the database level (returning HTTP 409 Conflict) and the UI level (buttons locked with "You Voted" badge).

4. **PostgreSQL Atomic Increment**:
   - Votes are recorded and counters are incremented in a **single atomic Common Table Expression (CTE)** statement directly in PostgreSQL:
     ```sql
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
     RETURNING p.*;
     ```
   - This eliminates race conditions, prevents overcounting under high concurrent load, and ensures expired polls reject subsequent votes atomically.

5. **Aesthetic Excellence**:
   - Futuristic dark luxury UI with glassmorphism (`backdrop-filter: blur(20px)`), vibrant neon accents, and smooth micro-animations.
   - Celebratory particle confetti (`canvas-confetti`) when a vote is cast.
   - Dynamic winner announcement banner with trophy reveal when the timer reaches 0.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, Vite 6, Vanilla CSS design system, Lucide icons, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.IO 4, `pg` (node-postgres connection pool).
- **Database**: PostgreSQL 16 (Alpine) running in a Docker container.

---

## 🚀 Quick Start Guide

### 1. Start PostgreSQL in Docker
```bash
docker compose up -d
```
*PostgreSQL will be running on port `5432` with database `voting_db`.*

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5000` with WebSocket support.*

### 3. Start the Frontend App
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📡 API & Socket.IO Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and PostgreSQL connectivity status |
| `GET` | `/api/polls/active` | Current active poll and voter state |
| `POST` | `/api/polls` | Create & broadcast a new poll (10s, 15s, 30s) |
| `POST` | `/api/polls/:id/vote` | Atomically cast a vote (`voterId`, `choice`) |
| `POST` | `/api/polls/:id/end` | Admin manual force end |
| `GET` | `/api/polls` | All historical polls and statistics |
| `DELETE` | `/api/polls/:id` | Delete poll record |

### Socket.IO Events
- **Server Broadcasts**:
  - `new_poll`: Notifies all connected homescreens that a new poll has arrived.
  - `vote_update`: Broadcasts updated counts (`option_a_votes`, `option_b_votes`) in real time.
  - `poll_ended`: Emits when the timer expires or admin ends the poll.
- **Client Emits**:
  - `request_active_poll`: Requests initial state upon connecting.
  - `cast_vote`: Submits vote via WebSocket.
