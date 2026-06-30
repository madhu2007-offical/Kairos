import { Router, Request, Response } from 'express';
import prisma from '../prisma';
import { decomposeGoal } from '../services/aiService';

const router = Router();

// GET all goals
router.get('/goals', async (req: Request, res: Response) => {
  try {
    const goals = await prisma.goal.findMany();
    // Parse milestones JSON string to actual arrays for frontend convenience
    const parsedGoals = goals.map(g => ({
      ...g,
      milestones: JSON.parse(g.milestones)
    }));
    res.json(parsedGoals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new goal and auto-decompose into sub-milestones
router.post('/goals', async (req: Request, res: Response) => {
  try {
    const { title, targetDate } = req.body;
    if (!title || !targetDate) {
      res.status(400).json({ error: 'Title and targetDate are required' });
      return;
    }

    const parsedTargetDate = new Date(targetDate);
    const milestones = await decomposeGoal(title, parsedTargetDate);

    const goal = await prisma.goal.create({
      data: {
        title,
        targetDate: parsedTargetDate,
        status: 'ACTIVE',
        milestones: JSON.stringify(milestones)
      }
    });

    res.json({
      ...goal,
      milestones
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all habits
router.get('/habits', async (req: Request, res: Response) => {
  try {
    const habits = await prisma.habit.findMany();
    const parsedHabits = habits.map(h => ({
      ...h,
      history: JSON.parse(h.history)
    }));
    res.json(parsedHabits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new habit
router.post('/habits', async (req: Request, res: Response) => {
  try {
    const { name, frequency, difficulty } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Habit name is required' });
      return;
    }

    const newHabit = await prisma.habit.create({
      data: {
        name,
        frequency: frequency || 'DAILY',
        difficulty: difficulty || 'MEDIUM',
        streak: 0,
        history: '[]'
      }
    });

    res.json({
      ...newHabit,
      history: []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST complete a habit for today (toggles/updates streak)
router.post('/habits/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    const now = new Date();
    const historyList = JSON.parse(habit.history) as string[];
    
    // Check if already completed today to prevent double completions
    const todayStr = now.toDateString();
    const alreadyCompletedToday = historyList.some(dateStr => new Date(dateStr).toDateString() === todayStr);

    if (alreadyCompletedToday) {
      // Toggle off / undo completion if clicked again
      const newHistoryList = historyList.filter(dateStr => new Date(dateStr).toDateString() !== todayStr);
      const newStreak = Math.max(0, habit.streak - 1);

      const updated = await prisma.habit.update({
        where: { id },
        data: {
          streak: newStreak,
          lastCompletedDate: newHistoryList.length > 0 ? new Date(newHistoryList[newHistoryList.length - 1]) : null,
          history: JSON.stringify(newHistoryList)
        }
      });

      res.json({
        ...updated,
        history: newHistoryList
      });
      return;
    }

    // Mark as completed today
    historyList.push(now.toISOString());
    
    // Calculate new streak
    let newStreak = habit.streak + 1;
    
    // If last completed date was longer than frequency, reset or check (basic checks)
    if (habit.lastCompletedDate) {
      const lastDate = new Date(habit.lastCompletedDate);
      const diffMs = now.getTime() - lastDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (habit.frequency === 'DAILY' && diffDays > 2.0) {
        newStreak = 1; // Streak broken, restart
      }
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        streak: newStreak,
        lastCompletedDate: now,
        history: JSON.stringify(historyList)
      }
    });

    res.json({
      ...updated,
      history: historyList
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
