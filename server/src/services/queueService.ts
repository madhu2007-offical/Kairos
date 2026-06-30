import prisma from '../prisma';

export interface NotificationNudge {
  id: string;
  taskId?: string;
  type: 'GENTLE' | 'WARNING' | 'AUTONOMOUS_DRAFT' | 'REPLAN_SUGGESTION';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

class QueueSchedulerService {
  private notifications: NotificationNudge[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  public getNotifications(): NotificationNudge[] {
    return this.notifications;
  }

  public addNotification(nudge: Omit<NotificationNudge, 'id' | 'timestamp' | 'isRead'>) {
    const newNudge: NotificationNudge = {
      ...nudge,
      id: `nudge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      isRead: false
    };
    this.notifications.unshift(newNudge); // new alerts on top
    // Cap at 30 alerts
    if (this.notifications.length > 30) {
      this.notifications.pop();
    }
    return newNudge;
  }

  public readNotification(id: string) {
    const nudge = this.notifications.find(n => n.id === id);
    if (nudge) {
      nudge.isRead = true;
    }
  }

  public clearNotifications() {
    this.notifications = [];
  }

  public startScheduler() {
    if (this.intervalId) return;

    // Check deadlines & simulate context shifts every 15 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.checkDeadlinesAndEscalate();
      } catch (err) {
        console.error('Error running scheduler check:', err);
      }
    }, 15000);

    // Initial nudge
    this.addNotification({
      type: 'GENTLE',
      title: 'Kairos Initialized',
      message: 'Workspace optimization engine online. Standing by to prioritize your tasks.'
    });
  }

  public stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async checkDeadlinesAndEscalate() {
    const now = new Date();
    // Fetch all active, incomplete tasks
    const activeTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] }
      }
    });

    for (const task of activeTasks) {
      const msToDeadline = task.deadline.getTime() - now.getTime();
      const hoursToDeadline = msToDeadline / (1000 * 60 * 60);

      // Level 1: Gentle reminder when due in less than 24 hours (only trigger nudge once)
      if (hoursToDeadline > 0 && hoursToDeadline <= 24 && hoursToDeadline > 2) {
        const hasGentle = this.notifications.some(n => n.taskId === task.id && n.type === 'GENTLE');
        if (!hasGentle) {
          this.addNotification({
            taskId: task.id,
            type: 'GENTLE',
            title: `Gentle Reminder: "${task.title}"`,
            message: `Due tomorrow (${task.deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). You have a open calendar slot this afternoon at 3:00 PM.`
          });
        }
      }

      // Level 2: Urgent warning when due in less than 2 hours
      if (hoursToDeadline > 0 && hoursToDeadline <= 2) {
        const hasWarning = this.notifications.some(n => n.taskId === task.id && n.type === 'WARNING');
        if (!hasWarning) {
          this.addNotification({
            taskId: task.id,
            type: 'WARNING',
            title: `Critical Focus Alert: "${task.title}"`,
            message: `This task is due in less than 2 hours! Delaying this will slip dependent workflows.`
          });
        }
      }

      // Level 3: Overdue tasks escalation nudge
      if (hoursToDeadline <= 0) {
        // If deadline missed, mark task as MISSED in database if not already done
        if (task.status !== 'MISSED') {
          await prisma.task.update({
            where: { id: task.id },
            data: { status: 'MISSED' }
          });

          this.addNotification({
            taskId: task.id,
            type: 'REPLAN_SUGGESTION',
            title: `Deadline Missed: "${task.title}"`,
            message: `Task has passed its deadline. Kairos is queuing a full calendar replan to accommodate this overdue work.`
          });
        }
      }
    }
  }

  // API to simulate external event triggers
  public async simulateUserBehavior(triggerType: 'LAPTOP_OPEN' | 'CALENDAR_CONFLICT' | 'LOCATION_CHANGE') {
    switch (triggerType) {
      case 'LAPTOP_OPEN':
        this.addNotification({
          type: 'GENTLE',
          title: 'Morning Sync Activated',
          message: 'Welcome back. Detected laptop open. Reading your prioritized focus blocks...'
        });
        break;
      case 'LOCATION_CHANGE':
        this.addNotification({
          type: 'GENTLE',
          title: 'Context Shift: Arrived Home',
          message: 'Detected shift to home location. Suggesting switch to recreational/personal priorities.'
        });
        break;
      case 'CALENDAR_CONFLICT':
        // Insert a conflict in the DB and trigger notification
        const conflictStart = new Date();
        conflictStart.setHours(conflictStart.getHours() + 1, 0, 0, 0); // starts in 1 hr
        const conflictEnd = new Date(conflictStart.getTime() + 60 * 60 * 1000); // 1 hour duration

        this.addNotification({
          type: 'REPLAN_SUGGESTION',
          title: 'Ad-hoc Meeting Conflict Detected',
          message: 'An unexpected meeting has been scheduled which overlaps with your Focus block for code review. Suggesting a 30-minute block delay.'
        });
        break;
    }
  }
}

export const queueScheduler = new QueueSchedulerService();
