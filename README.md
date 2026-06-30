<div align="center">

# ⏳ Kairos

### AI-Powered Proactive Productivity Companion

*Not another reminder app. An assistant that plans, prioritizes, and acts.*

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/madhu2007-offical/Kairos.git)
![TypeScript](https://img.shields.io/badge/TypeScript-94.8%25-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)

[Live Demo](#) · [Report Bug](https://github.com/madhu2007-offical/Kairos/issues) · [Request Feature](https://github.com/madhu2007-offical/Kairos/issues)

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Deployment](#deployment)
  - [Option A — Google Cloud Run](#option-a--google-cloud-run-recommended)
  - [Option B — Vercel](#option-b--vercel-serverless)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About the Project

**Kairos** (Greek: *καιρός* — "the opportune moment") is a full-stack AI productivity companion built to close the gap between **intention** and **execution**. It was built for the AI-Powered Productivity Companion challenge, where the goal was to move beyond passive reminders and build something that genuinely helps people get things done.

Most productivity tools store information. Kairos reasons about it — and acts on it.

---

## The Problem

Students, professionals, and entrepreneurs routinely miss deadlines, assignments, meetings, bill payments, and important commitments — not because they don't know what's due, but because existing tools only *notify*. A calendar event firing at 9:00 AM does nothing to help someone who is already overloaded decide what to drop, what to do first, or how to actually start. Passive reminders are easy to dismiss and do nothing to close the gap between knowing and doing.

## The Solution

Kairos behaves less like a to-do list and more like a capable assistant. It:

- Audits the user's calendar and task list continuously
- Computes a dynamic priority score for every task based on urgency, importance, effort, and opportunity cost of delay
- Automatically time-blocks focus sessions around real calendar constraints
- Reschedules in real time when meetings run over or priorities shift
- Stages low-risk actions (drafting updates, booking holds) for one-click approval — never acting blindly
- Logs every decision in a transparent, reversible audit trail

---

## Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Intelligent Prioritization Engine** | Scores tasks on urgency, importance, effort, and dependency networks — not just due-date sorting |
| 2 | **Adaptive Daily Time-Blocking** | Auto-slots focus blocks into the calendar, avoiding fatigue windows and quiet hours; reschedules dynamically on conflict |
| 3 | **Bounded AI Agency** | Stages draft actions (emails, calendar holds) for 1-click approval, with full audit log + 1-click undo |
| 4 | **Natural Speech Interface** | Add tasks by voice (*"Submit report by tomorrow 5pm, takes 2 hours"*) and receive spoken daily briefings |
| 5 | **Explain-o-Meter** | Every AI decision is logged with a plain-language explanation of *why* — building trust in autonomy |
| 6 | **Context Simulation Engine** | Simulates real-world disruptions (location change, meeting overlap, laptop reopen) to demonstrate adaptive replanning |

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Tailwind CSS
- Zustand — state management
- Recharts — data visualization
- Lucide Icons

**Backend**
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)

**AI & Orchestration**
- LLM-based reasoning for prioritization and natural language task parsing
- Rule-based fallback compiler (graceful degradation if no API key is present)
- Background cron-based audit loop for deadline and context monitoring

**Infrastructure**
- Docker
- Google Cloud Run / Cloud Build (primary deployment target)
- Vercel Serverless (alternative deployment target)

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React Client    │◄────►│   Express API     │◄────►│   Prisma + DB     │
│  (Vite, Zustand)  │      │  (TypeScript)     │      │ (SQLite/Postgres) │
└─────────────────┘      └────────┬─────────┘      └─────────────────┘
                                       │
                          ┌──────────┴───────────┐
                          │   AI Reasoning Layer    │
                          │ (LLM + rule fallback)   │
                          └──────────┬───────────┘
                                       │
                          ┌──────────┴───────────┐
                          │  Background Audit Cron  │
                          │ (deadline + context loop)│
                          └─────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- (Optional) An LLM API key for full AI reasoning — the app falls back to rule-based logic without one

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/madhu2007-offical/Kairos.git
cd Kairos
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# AI provider (optional — falls back to rule-based logic if omitted)
ANTHROPIC_API_KEY=your_key_here

# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=5000
```

> For production, swap `DATABASE_URL` to a managed PostgreSQL instance (Cloud SQL, Neon, or Supabase) — SQLite does not persist on serverless/container platforms.

### Running Locally

Initialize the database schema:

```bash
npm run prisma:push
```

Start both the frontend and backend concurrently:

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |

---

## Deployment

### Option A — Google Cloud Run (recommended)

The repository includes a production-ready `Dockerfile` that bundles the frontend build, compiled server, and static asset routing into a single container.

**1. One-click deploy**

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/madhu2007-offical/Kairos.git)

**2. Manual CLI deploy**

```bash
# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/kairos

# Deploy to Cloud Run
gcloud run deploy kairos \
  --image gcr.io/YOUR_PROJECT_ID/kairos \
  --platform managed \
  --allow-unauthenticated \
  --region us-central1
```

Cloud Run automatically injects a dynamic `PORT` variable, which the Express server binds to out of the box.

### Option B — Vercel (Serverless)

1. Import the repository into the Vercel dashboard.
2. Point `DATABASE_URL` at a remote PostgreSQL instance (Neon/Supabase) and update the provider in `prisma/schema.prisma`.
3. Vercel automatically deploys the static frontend and wires up `/api/cron`, triggered every 5 minutes, to run background scheduler audits.

---

## Project Structure

```
Kairos/
├── api/              # Serverless function entrypoints (Vercel)
├── public/           # Static assets
├── server/           # Express backend, AI orchestration, cron jobs
├── src/              # React frontend source
├── Dockerfile         # Container build for Cloud Run
├── vercel.json        # Vercel routing & cron config
└── package.json
```

---

## Roadmap

- [ ] Two-way Google Calendar sync
- [ ] Push notifications (context-triggered, not timer-based)
- [ ] Multi-user collaboration / shared task pools
- [ ] Habit streak analytics dashboard
- [ ] Mobile-first PWA support

---

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for details.

---

## Acknowledgements

Built for the AI-Powered Productivity Companion challenge — designed to demonstrate how AI can move beyond passive reminders toward genuine, trustworthy task completion assistance.

</div>
