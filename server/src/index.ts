import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import prisma from './prisma';
import taskRoutes from './routes/tasks';
import scheduleRoutes from './routes/schedule';
import goalRoutes from './routes/goals';
import actionRoutes from './routes/actions';
import { queueScheduler } from './services/queueService';
import { generateDailyBriefing } from './services/aiService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Bootloader to seed database with initial user and mock data if empty
async function databaseBootloader() {
  try {
    // 1. Ensure user exists
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'user-1',
          email: 'user@kairos.ai',
          name: 'Elena Rostova',
          autonomyLevel: 'DRAFT_AND_CONFIRM',
          peakFocusStart: 9,
          peakFocusEnd: 12,
          quietHourStart: 21,
          quietHourEnd: 7,
          calendarConnected: true
        }
      });
      console.log('Seeded default user.');
    }

    // 2. Seed mock tasks if empty
    const taskCount = await prisma.task.count();
    if (taskCount === 0) {
      const now = new Date();
      
      const seedTasks = [
        {
          title: "Complete Q3 product alignment presentation",
          duration: 120, // 2 hours
          deadline: new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000), // Due in 1.5 days
          urgency: 0.85,
          importance: 0.90,
          effort: 0.65,
          opportunityCost: 0.80,
          priorityScore: 0.88,
          explanation: "Critical client and board alignment dependency. Delaying this compresses review windows for the leadership team.",
          status: "TODO",
          context: "WORK"
        },
        {
          title: "Prepare technical architecture guidelines",
          duration: 180, // 3 hours
          deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Due in 4 days
          urgency: 0.45,
          importance: 0.80,
          effort: 0.85,
          opportunityCost: 0.50,
          priorityScore: 0.68,
          explanation: "High importance but moderate urgency. Gives guidelines to contractors. Schedule in morning focus hours.",
          status: "TODO",
          context: "WORK"
        },
        {
          title: "Weekly grocery run and meal prep",
          duration: 90,
          deadline: new Date(now.getTime() + 12 * 60 * 60 * 1000), // Due in 12 hours (tonight)
          urgency: 0.90,
          importance: 0.40,
          effort: 0.50,
          opportunityCost: 0.70,
          priorityScore: 0.62,
          explanation: "Time-sensitive personal task. Must execute before stores close to maintain healthy weekly routines.",
          status: "TODO",
          context: "PERSONAL"
        },
        {
          title: "Review team commits and approve pull requests",
          duration: 45,
          deadline: new Date(now.getTime() + 8 * 60 * 60 * 1000), // Due in 8 hours (today)
          urgency: 0.70,
          importance: 0.70,
          effort: 0.30,
          opportunityCost: 0.85,
          priorityScore: 0.76,
          explanation: "Blocks three engineers' code deploy paths. High opportunity cost to hold this back.",
          status: "IN_PROGRESS",
          context: "WORK"
        }
      ];

      for (const t of seedTasks) {
        await prisma.task.create({ data: t });
      }
      console.log('Seeded default tasks.');
    }

    // 3. Seed default schedule blocks (like standard meeting events)
    const blockCount = await prisma.scheduleBlock.count();
    if (blockCount === 0) {
      const now = new Date();
      
      // Meeting block today from 1 PM to 2 PM
      const meetStart = new Date(now);
      meetStart.setHours(13, 0, 0, 0);
      const meetEnd = new Date(now);
      meetEnd.setHours(14, 0, 0, 0);

      await prisma.scheduleBlock.create({
        data: {
          title: "Daily Standup & Sync Meeting",
          start: meetStart,
          end: meetEnd,
          type: "MEETING",
          isLocked: true
        }
      });
      console.log('Seeded default schedule blocks (meetings).');
    }

    // 4. Seed habits
    const habitCount = await prisma.habit.count();
    if (habitCount === 0) {
      await prisma.habit.create({
        data: {
          name: "Deep focus reading (30 min)",
          frequency: "DAILY",
          streak: 4,
          difficulty: "MEDIUM"
        }
      });
      await prisma.habit.create({
        data: {
          name: "Morning aerobic exercise",
          frequency: "DAILY",
          streak: 7,
          difficulty: "EASY"
        }
      });
      console.log('Seeded default habits.');
    }
    
    // 5. Seed an initial action
    const actionCount = await prisma.autonomousAction.count();
    if (actionCount === 0) {
      await prisma.autonomousAction.create({
        data: {
          type: "EMAIL_DRAFT",
          title: "Draft status update: Complete Q3 product alignment presentation",
          state: "PENDING",
          details: JSON.stringify({
            recipient: "manager@kairos.ai",
            subject: "Update: Aligning Q3 presentation focus block",
            body: "Hi team,\n\nI have locked a focus block this morning to conclude the Q3 alignment presentation. I will share the draft slides by tomorrow afternoon.\n\nBest,\nElena"
          }),
          explanation: "High-priority presentation due tomorrow. Pre-drafting updates aligns leadership and preempts status check-in messages."
        }
      });
      console.log('Seeded default actions.');
    }

  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Routes registration
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api', goalRoutes);
app.use('/api/actions', actionRoutes);

// GET/PUT User profile and settings
app.get('/api/user', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user', async (req: Request, res: Response) => {
  try {
    const { autonomyLevel, peakFocusStart, peakFocusEnd, quietHourStart, quietHourEnd, calendarConnected } = req.body;
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        autonomyLevel: autonomyLevel ?? user.autonomyLevel,
        peakFocusStart: peakFocusStart !== undefined ? parseInt(peakFocusStart) : user.peakFocusStart,
        peakFocusEnd: peakFocusEnd !== undefined ? parseInt(peakFocusEnd) : user.peakFocusEnd,
        quietHourStart: quietHourStart !== undefined ? parseInt(quietHourStart) : user.quietHourStart,
        quietHourEnd: quietHourEnd !== undefined ? parseInt(quietHourEnd) : user.quietHourEnd,
        calendarConnected: calendarConnected !== undefined ? calendarConnected : user.calendarConnected
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications endpoint
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(queueScheduler.getNotifications());
});

app.post('/api/notifications/read/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  queueScheduler.readNotification(id as string);
  res.json({ success: true });
});

app.post('/api/notifications/clear', (req: Request, res: Response) => {
  queueScheduler.clearNotifications();
  res.json({ success: true });
});

// Simulate triggers endpoint
app.post('/api/simulate', async (req: Request, res: Response) => {
  try {
    const { trigger } = req.body;
    if (!trigger) {
      res.status(400).json({ error: 'Trigger type is required' });
      return;
    }

    await queueScheduler.simulateUserBehavior(trigger);
    res.json({ success: true, message: `Simulated trigger: ${trigger}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI briefing endpoint
app.get('/api/briefing', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } });
    const events = await prisma.scheduleBlock.findMany({ where: { type: 'MEETING' } });
    const user = await prisma.user.findFirst();
    const quietHrs = user ? `${user.quietHourStart}:00 to ${user.quietHourEnd}:00` : '21:00 to 07:00';
    
    const briefing = await generateDailyBriefing(tasks, events, quietHrs);
    res.json({ briefing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Expose Cron Endpoint for Vercel Scheduler
app.get('/api/cron', async (req: Request, res: Response) => {
  try {
    console.log('Vercel Cron Trigger received. Auditing timeline deadlines...');
    await databaseBootloader();
    await queueScheduler.checkDeadlinesAndEscalate();
    res.json({ success: true, message: 'Scheduler audit complete.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets from the compiled React app
const staticPath = path.join(__dirname, '../../dist');
app.use(express.static(staticPath));

// Catch-all route to serve the React index.html for client routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Server bootup logic (only run standard listener if not in Vercel serverless context)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Run db bootloader and starts backgrounds
    await databaseBootloader();
    queueScheduler.startScheduler();
  });
}

export default app;
