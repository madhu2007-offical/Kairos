import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

// GET all autonomous actions
router.get('/', async (req: Request, res: Response) => {
  try {
    const actions = await prisma.autonomousAction.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const parsedActions = actions.map(act => ({
      ...act,
      details: JSON.parse(act.details)
    }));

    res.json(parsedActions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Approve an action (triggers execution side-effects)
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const action = await prisma.autonomousAction.findUnique({ where: { id } });
    if (!action) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    const details = JSON.parse(action.details);

    // Perform execution side-effects based on action type
    if (action.type === 'CALENDAR_HOLD' && details.start && details.end) {
      // Create a schedule block representing the calendar hold
      const newBlock = await prisma.scheduleBlock.create({
        data: {
          title: `Hold: ${action.title.replace('Block personal calendar for ', '')}`,
          start: new Date(details.start),
          end: new Date(details.end),
          type: 'BUFFER',
          isLocked: true // Locked since user approved it
        }
      });
      
      // Store the created block ID inside details so we can revert it on Undo
      details.createdBlockId = newBlock.id;
    }

    const updated = await prisma.autonomousAction.update({
      where: { id },
      data: {
        state: 'EXECUTED',
        details: JSON.stringify(details)
      }
    });

    res.json({
      ...updated,
      details
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Reject an action
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.autonomousAction.update({
      where: { id },
      data: {
        state: 'REJECTED'
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST Undo an executed action (reverts side-effects)
router.post('/:id/undo', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const action = await prisma.autonomousAction.findUnique({ where: { id } });
    if (!action) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    const details = JSON.parse(action.details);

    // Revert execution side-effects
    if (action.type === 'CALENDAR_HOLD' && details.createdBlockId) {
      // Remove the schedule block
      await prisma.scheduleBlock.delete({
        where: { id: details.createdBlockId }
      }).catch(err => console.warn("Hold block already deleted or missing:", err));
      
      delete details.createdBlockId;
    }

    const updated = await prisma.autonomousAction.update({
      where: { id },
      data: {
        state: 'UNDONE',
        details: JSON.stringify(details)
      }
    });

    res.json({
      ...updated,
      details
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
