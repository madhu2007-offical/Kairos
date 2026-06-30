# Kairos — AI-Powered Proactive Productivity Companion

Kairos is a full-stack web application designed to reduce cognitive load and protect focus. Unlike typical task apps that reactively send notification alarms, Kairos audits your calendar, prioritizes tasks based on deadline urgency and delay opportunity cost, schedules focus slots dynamically, drafts alignment logs, and schedules calendar holds.

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/madhu2007-offical/Kairos.git)

---

## Key Features

1. **Intelligent Prioritization Engine**: Scores tasks on urgency, importance, effort, and dependency networks to compute a dynamic priority score.
2. **Adaptive Daily Time-Blocking**: Automatically slots focus blocks into your calendar avoiding peak fatigue windows and quiet hours. Reschedules blocks dynamically if meetings overrun, logging changes in the **Explain-o-meter** ledger.
3. **Bounded AI Agency**: staged draft actions (like writing email updates or booking personal blocks) allow 1-click approvals and 1-click audit reverts (Undo).
4. **Natural Speech Interface**: Speak tasks naturally (e.g. *"Submit report by tomorrow 5pm, takes 2 hours"*) to add them to the queue, and play audio briefings via browser speech synthesis.
5. **Simulated Event Loop**: Audits approaching deadlines to trigger warnings, and features simulator settings (location changes, laptop lid open, meeting overlaps) to audit queue shifting.

---

## Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand, Recharts, Lucide Icons.
* **Backend**: Node.js, Express, TypeScript, Prisma Client, SQLite.
* **Orchestration**: Background Cron audit logic, local embedding-free semantic mapping, and Anthropic Claude SDK (falls back to a rule-based compiler if `ANTHROPIC_API_KEY` is not present).

---

## Local Development Setup

### 1. Install Dependencies
Run the unified installer in the root folder:
```bash
npm install
```

### 2. Deploy Schema
Initialize the SQLite database and load models:
```bash
npm run prisma:push
```

### 3. Run Dev Server
Launch Vite React client and the Express backend concurrently:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173/`
* **Backend**: `http://localhost:5000/`

---

## Deployment Options

### Option A: Deploy to Google Cloud Run (Containerized)

We have provided a fully configured **[Dockerfile](file:///d:/Kairos/Dockerfile)** that packages the frontend build, server compiler, database seeding, and Express static asset routing into a single lightweight container.

#### 1. Quick Deploy Button
Click the badge below to deploy the repository directly to your Google Cloud Run Console in 1 click:

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/madhu2007-offical/Kairos.git)

#### 2. Manual CLI Deploy
If you have the `gcloud` SDK installed locally, run:
```bash
# Build the container via Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/kairos

# Deploy to Cloud Run
gcloud run deploy kairos --image gcr.io/YOUR_PROJECT_ID/kairos --platform managed --allow-unauthenticated --region us-central1
```

*Note: Cloud Run injects a dynamic `PORT` variable which the Express index automatically binds to.*

---

### Option B: Deploy to Vercel (Serverless)

Vercel hosts the client static assets and runs the Express backend as Serverless Functions using the root **[vercel.json](file:///d:/Kairos/vercel.json)**.

1. Import the repository into your Vercel Dashboard.
2. Link your preferred remote PostgreSQL database (like Neon or Supabase) by changing the provider in `schema.prisma` and settings `DATABASE_URL` in the environment variable panel.
3. Vercel automatically deploys the frontend and hooks the `/api/cron` scheduled task (triggered every 5 minutes) to run the background scheduler audits.
