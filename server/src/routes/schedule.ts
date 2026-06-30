import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all calendar schedule blocks
router.get('/', async (req: Request, res: Response) => {
  try {
    const blocks = await prisma.scheduleBlock.findMany({
      orderBy: {
        start: 'asc'
      }
    });
    res.json(blocks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST trigger calendar auto-replan based on current priorities
router.post('/replan', async (req: Request, res: Response) => {
  try {
    // 1. Get user configuration
    const user = await prisma.user.findFirst();
    const peakStart = user?.peakFocusStart ?? 9;
    const peakEnd = user?.peakFocusEnd ?? 12;
    const quietStart = user?.quietHourStart ?? 21;
    const quietEnd = user?.quietHourEnd ?? 7;

    // 2. Fetch active incomplete tasks, ordered by priority score descending
    const activeTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] }
      },
      orderBy: {
        priorityScore: 'desc'
      }
    });

    // 3. Fetch existing blocks (meetings and locked items) that we shouldn't overwrite
    const untouchableBlocks = await prisma.scheduleBlock.findMany({
      where: {
        OR: [
          { type: 'MEETING' },
          { isLocked: true }
        ]
      }
    });

    // 4. Delete existing dynamic unlocked FOCUS/BUFFER/BREAK holds
    await prisma.scheduleBlock.deleteMany({
      where: {
        type: { in: ['FOCUS', 'BUFFER', 'BREAK'] },
        isLocked: false
      }
    });

    const explanationLog: string[] = [];
    const scheduledBlocks = [];

    // Helper to check if a proposed time slot overlaps with untouchable blocks
    const hasOverlap = (start: Date, end: Date) => {
      return untouchableBlocks.some(block => {
        return (start < block.end && end > block.start);
      });
    };

    // Simple slot allocation algorithm
    let currentPointer = new Date();
    currentPointer.setMinutes(currentPointer.getMinutes() + 10 - (currentPointer.getMinutes() % 10), 0, 0); // Align to nearest 10 mins

    for (const task of activeTasks) {
      let durationMins = task.duration;
      let scheduled = false;
      let attempts = 0;

      // Look up to 7 days ahead for a slot
      while (!scheduled && attempts < 1000) {
        attempts++;

        const hour = currentPointer.getHours();
        
        // Rule: Avoid quiet hours (e.g. 9 PM - 7 AM)
        if (hour >= quietStart || hour < quietEnd) {
          // Roll to next day at quietEnd AM
          currentPointer.setDate(currentPointer.getDate() + 1);
          currentPointer.setHours(quietEnd, 0, 0, 0);
          continue;
        }

        // Rule: Preference for peak focus hours (e.g. 9 AM - 12 PM) for high importance tasks
        const isPeak = hour >= peakStart && hour < peakEnd;
        if (task.priorityScore > 0.65 && !isPeak && hour < peakStart) {
          // Fast forward to peak focus window start
          currentPointer.setHours(peakStart, 0, 0, 0);
          continue;
        }

        const slotStart = new Date(currentPointer);
        const slotEnd = new Date(currentPointer.getTime() + durationMins * 60 * 1000);

        // Check if deadline is violated by scheduling here
        if (slotEnd > task.deadline) {
          explanationLog.push(`Warning: "${task.title}" scheduled block wraps beyond deadline due to scheduling congestion.`);
        }

        // Check overlap with untouchable blocks
        if (hasOverlap(slotStart, slotEnd)) {
          // Advance pointer by 30 mins and check again
          currentPointer.setMinutes(currentPointer.getMinutes() + 30);
          continue;
        }

        // Available slot found! Create schedule block
        const newBlock = await prisma.scheduleBlock.create({
          data: {
            taskId: task.id,
            title: `Focus: ${task.title}`,
            start: slotStart,
            end: slotEnd,
            type: 'FOCUS'
          }
        });

        scheduledBlocks.push(newBlock);
        explanationLog.push(`Scheduled Focus block for "${task.title}" at ${slotStart.toLocaleDateString()} ${slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Dynamic rank: AI score ${task.priorityScore.toFixed(2)})`);
        
        // Move pointer to end of this block + 10 min break
        currentPointer = new Date(slotEnd.getTime() + 10 * 60 * 1000);
        scheduled = true;
      }
    }

    // Add buffers where there are gaps between focus blocks and meetings
    // For simplicity, just return the scheduled blocks and write explanation
    const explanation = explanationLog.length > 0 
      ? explanationLog.join('\n') 
      : 'All clear. No active tasks to schedule.';

    res.json({
      success: true,
      blocks: [...untouchableBlocks, ...scheduledBlocks],
      explanation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update schedule block start/end times (drag-and-drop manual override)
router.put('/block/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { start, end, isLocked } = req.body;

    const block = await prisma.scheduleBlock.findUnique({ where: { id } });
    if (!block) {
      res.status(404).json({ error: 'Schedule block not found' });
      return;
    }

    const updated = await prisma.scheduleBlock.update({
      where: { id },
      data: {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        isLocked: isLocked !== undefined ? isLocked : true // Lock automatically when manually adjusted
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a schedule block
router.delete('/block/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.scheduleBlock.delete({ where: { id } });
    res.json({ message: 'Schedule block deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
