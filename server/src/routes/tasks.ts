import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { parseNaturalLanguageTask, scoreAndPrioritizeTask } from '../services/aiService';
import { queueScheduler } from '../services/queueService';

const router = Router();

// GET all tasks sorted by priorityScore desc
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        priorityScore: 'desc'
      }
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new task (supports NLP parsing)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { input, isNlp } = req.body;
    let title = req.body.title;
    let duration = parseInt(req.body.duration) || 60;
    let deadline = req.body.deadline ? new Date(req.body.deadline) : new Date();
    let context = req.body.context || 'WORK';

    // Parse NLP if specified
    if (isNlp && input) {
      const parsed = parseNaturalLanguageTask(input);
      title = parsed.title;
      duration = parsed.duration;
      deadline = parsed.deadline;
      context = parsed.context;
    }

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const count = await prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } });

    // AI Prioritization Scoring
    const scoring = await scoreAndPrioritizeTask({ title, duration, deadline, context }, count);

    const newTask = await prisma.task.create({
      data: {
        title,
        duration,
        deadline,
        urgency: scoring.urgency,
        importance: scoring.importance,
        effort: scoring.effort,
        opportunityCost: scoring.opportunityCost,
        priorityScore: scoring.priorityScore,
        explanation: scoring.explanation,
        context,
        status: 'TODO'
      }
    });

    // Auto-create a pending action hold for high importance / high urgency task
    if (scoring.priorityScore > 0.75) {
      let actionTitle = '';
      let details = '';
      let explanation = '';

      if (context === 'WORK') {
        actionTitle = `Draft email update to team regarding "${title}"`;
        details = JSON.stringify({
          recipient: 'team@kairos.ai',
          subject: `Update: Scheduling work for ${title}`,
          body: `Hi team,\n\nI have scheduled focus time to address "${title}". I'm working to complete this before the deadline on ${deadline.toLocaleString()}.\n\nBest,\nUser (via Kairos)`
        });
        explanation = `Kairos detected "${title}" is a critical work priority. Pre-drafting this update keeps your stakeholders aligned and saves drafting time.`;
      } else {
        actionTitle = `Block personal calendar for "${title}"`;
        details = JSON.stringify({
          start: new Date(deadline.getTime() - duration * 60 * 1000).toISOString(),
          end: deadline.toISOString(),
          description: `Focus window reserved for personal chore: ${title}`
        });
        explanation = `Critical personal deadline detected. Safeguarding this slot ensures you have uninterrupted time before the deadline.`;
      }

      await prisma.autonomousAction.create({
        data: {
          type: context === 'WORK' ? 'EMAIL_DRAFT' : 'CALENDAR_HOLD',
          title: actionTitle,
          state: 'PENDING',
          details,
          explanation
        }
      });

      queueScheduler.addNotification({
        taskId: newTask.id,
        type: 'AUTONOMOUS_DRAFT',
        title: 'New Autonomous Hold Created',
        message: `Drafted an action plan for: "${newTask.title}". View Actions Log to review.`
      });
    }

    res.json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, title, duration, deadline, context } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (title !== undefined) dataToUpdate.title = title;
    if (duration !== undefined) dataToUpdate.duration = duration;
    if (deadline !== undefined) dataToUpdate.deadline = new Date(deadline);
    if (context !== undefined) dataToUpdate.context = context;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate
    });

    // If marked completed, delete corresponding calendar block
    if (status === 'COMPLETED') {
      await prisma.scheduleBlock.deleteMany({
        where: { taskId: id }
      });
    }

    res.json(updatedTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Batch re-prioritize all incomplete tasks
router.post('/re-prioritize', async (req: Request, res: Response) => {
  try {
    const activeTasks = await prisma.task.findMany({
      where: { status: { in: ['TODO', 'IN_PROGRESS'] } }
    });

    const updatedTasks = [];
    for (const task of activeTasks) {
      const scoring = await scoreAndPrioritizeTask({
        title: task.title,
        duration: task.duration,
        deadline: task.deadline,
        context: task.context
      }, activeTasks.length);

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          urgency: scoring.urgency,
          importance: scoring.importance,
          effort: scoring.effort,
          opportunityCost: scoring.opportunityCost,
          priorityScore: scoring.priorityScore,
          explanation: scoring.explanation
        }
      });
      updatedTasks.push(updated);
    }
    res.json(updatedTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
