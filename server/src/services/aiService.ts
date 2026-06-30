import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface TaskPrioritizationInput {
  title: string;
  duration: number; // in mins
  deadline: Date;
  context: string;
}

export interface TaskPrioritizationOutput {
  urgency: number;      // 0-1
  importance: number;   // 0-1
  effort: number;       // 0-1
  opportunityCost: number; // 0-1
  priorityScore: number; // 0-1
  explanation: string;
}

/**
 * Natural language processing helper to extract metadata from task inputs
 */
export function parseNaturalLanguageTask(text: string): { title: string; duration: number; deadline: Date; context: string } {
  const now = new Date();
  let duration = 60; // Default: 1 hour
  let deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Default: 3 days from now
  let context = 'WORK';
  let title = text;

  // Extract duration keywords
  const durationMatch = text.match(/(\d+)\s*(hr|hour|min|minute|h|m)s?/i);
  if (durationMatch) {
    const val = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      duration = val * 60;
    } else {
      duration = val;
    }
    // Clean title
    title = title.replace(durationMatch[0], '');
  }

  // Extract deadline keywords
  if (/today/i.test(text)) {
    deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0); // Today 6 PM
    title = title.replace(/today/i, '');
  } else if (/tomorrow/i.test(text)) {
    deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    deadline.setHours(17, 0, 0, 0); // Tomorrow 5 PM
    title = title.replace(/tomorrow/i, '');
  } else if (/by friday/i.test(text)) {
    // Find next Friday
    const day = now.getDay();
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    deadline = new Date(now.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
    deadline.setHours(17, 0, 0, 0);
    title = title.replace(/by friday/i, '');
  } else if (/by monday/i.test(text)) {
    const day = now.getDay();
    const daysUntilMonday = (1 - day + 7) % 7 || 7;
    deadline = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    deadline.setHours(9, 0, 0, 0);
    title = title.replace(/by monday/i, '');
  }

  // Context detection
  if (/personal|home|family|gym|buy/i.test(text)) {
    context = 'PERSONAL';
  } else if (/play|relax|game|movie|chill/i.test(text)) {
    context = 'RECREATIONAL';
  }

  // Clean extra spaces and punctuation
  title = title.replace(/\s+/g, ' ').replace(/(^\s*-\s*|\s*by\s*$|\s*in\s*$)/i, '').trim();
  if (!title) {
    title = text;
  }

  return { title, duration, deadline, context };
}

/**
 * Score a task using LLM (if configured) or the local heuristic engine.
 */
export async function scoreAndPrioritizeTask(task: TaskPrioritizationInput, existingTasksCount: number = 0): Promise<TaskPrioritizationOutput> {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: 'You are the intelligence layer of Kairos, an AI productivity companion. Analyze the task and return a structured JSON response containing: urgency (0.0 to 1.0), importance (0.0 to 1.0), effort (0.0 to 1.0), opportunityCost (0.0 to 1.0), priorityScore (0.0 to 1.0), and a concise, clear 1-2 sentence explanation of why this priority score was assigned. Focus on urgency vs. importance, impact on scheduling, and opportunity cost of delaying this task.',
        messages: [{
          role: 'user',
          content: `Analyze this task for prioritization:
          Title: "${task.title}"
          Duration: ${task.duration} minutes
          Deadline: ${task.deadline.toISOString()}
          Context: ${task.context}
          Current workload (tasks pending): ${existingTasksCount}
          
          Format the output strictly as JSON with this schema:
          {
            "urgency": float,
            "importance": float,
            "effort": float,
            "opportunityCost": float,
            "priorityScore": float,
            "explanation": "string"
          }`
        }]
      });

      // Parse JSON from assistant response safely
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const data = JSON.parse(jsonStr) as TaskPrioritizationOutput;
        return data;
      }
    } catch (e) {
      console.warn("Anthropic API prioritization failed, falling back to local heuristic scoring:", e);
    }
  }

  // Local heuristic fallback logic
  const now = new Date();
  const msToDeadline = task.deadline.getTime() - now.getTime();
  const hoursToDeadline = msToDeadline / (1000 * 60 * 60);

  // Urgency: higher score closer to deadline
  let urgency = 0.5;
  if (hoursToDeadline <= 0) urgency = 1.0;
  else if (hoursToDeadline <= 4) urgency = 0.95;
  else if (hoursToDeadline <= 12) urgency = 0.85;
  else if (hoursToDeadline <= 24) urgency = 0.75;
  else if (hoursToDeadline <= 48) urgency = 0.55;
  else if (hoursToDeadline <= 72) urgency = 0.40;
  else urgency = Math.max(0.1, 0.3 - (hoursToDeadline / 240));

  // Importance heuristics based on title keywords
  let importance = 0.5;
  if (/pitch|report|deadline|submit|exam|client|boss|critical|urgent/i.test(task.title)) {
    importance = 0.85;
  } else if (/setup|clean|buy|grocery|call|check|read|browse/i.test(task.title)) {
    importance = 0.35;
  }

  // Effort: proportional to duration
  let effort = Math.min(1.0, Math.max(0.1, task.duration / 300)); // 5 hours is max effort 1.0

  // Opportunity cost: cost of delaying. High if importance is high and deadline is near, or duration is long (harder to slot in later)
  let opportunityCost = (importance * 0.6) + (urgency * 0.4);
  if (task.duration > 120) {
    opportunityCost += 0.15; // Longer tasks are harder to schedule, so delaying them has higher cost
  }
  opportunityCost = Math.min(1.0, Math.max(0.0, opportunityCost));

  // Calculate priority score: 45% importance, 35% urgency, 10% opportunity cost, minus 10% effort penalty (to keep scheduling efficient, though high-priority long tasks still win)
  let priorityScore = (importance * 0.45) + (urgency * 0.35) + (opportunityCost * 0.20) - (effort * 0.1);
  priorityScore = Math.min(1.0, Math.max(0.0, priorityScore));

  // Explanation strings based on heuristics
  let explanation = '';
  if (urgency > 0.8) {
    explanation = `Kairos prioritized this task due to a tight deadline (${Math.round(hoursToDeadline)} hours remaining). Immediate attention is required to avoid delay.`;
  } else if (importance > 0.8 && task.duration > 120) {
    explanation = `High importance task with a long duration (${Math.round(task.duration / 60)} hours). Kairos booked a slot early to prevent calendar fragmentation.`;
  } else if (opportunityCost > 0.7) {
    explanation = `Prioritized because delaying this will cause scheduling conflicts and increase workload compression later this week.`;
  } else {
    explanation = `Balanced priority. Urgency is moderate and effort is manageable (${task.duration} mins), fitting smoothly into your upcoming calendar gaps.`;
  }

  return { urgency, importance, effort, opportunityCost, priorityScore, explanation };
}

/**
 * Break down goals into milestones/actionable subtasks
 */
export async function decomposeGoal(title: string, targetDate: Date): Promise<Array<{ title: string; duration: number; daysOffset: number }>> {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: 'You are the goal decomposer service for Kairos. Analyze the user goal and the target date, and generate a list of actionable subtasks/milestones. For each subtask, specify: title, estimated duration in minutes, and daysOffset (how many days from today this task should be completed). Return only JSON.',
        messages: [{
          role: 'user',
          content: `Decompose this goal: "${title}". Target deadline: ${targetDate.toDateString()}. 
          Generate 3 to 5 realistic step-by-step milestones leading up to this date.
          Format: JSON array of objects: [{"title": "step 1", "duration": 45, "daysOffset": 1}]`
        }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = text.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn("Anthropic API goal decomposition failed, using local generator:", e);
    }
  }

  // Local fallback goal decomposition
  const steps = [
    { title: `Research and outline parameters for "${title}"`, duration: 45, daysOffset: 1 },
    { title: `Draft core structure and first iteration of "${title}"`, duration: 90, daysOffset: 3 },
    { title: `Review, refine, and perform quality checks on "${title}"`, duration: 60, daysOffset: 5 },
    { title: `Finalize and submit "${title}"`, duration: 30, daysOffset: 6 }
  ];

  // Adjust daysOffset if targetDate is closer
  const diffDays = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays < 6) {
    return steps.map((s, idx) => ({
      ...s,
      daysOffset: Math.min(diffDays, Math.max(1, Math.round((idx + 1) * (diffDays / 4))))
    }));
  }

  return steps;
}

/**
 * Generate AI Morning/Evening briefings
 */
export async function generateDailyBriefing(tasks: any[], events: any[], quietHours: string): Promise<string> {
  const topTasks = tasks.filter(t => t.status !== 'COMPLETED').slice(0, 3);
  
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: 'You are Kairos, the productivity companion. Write a warm, punchy briefing (100-150 words) to read to the user. Mention top 3 priorities, say how you cleared focus blocks, and mention any tasks or autonomous holds awaiting approval. Keep the tone calm, direct, and reassuring. Avoid corporate speak.',
        messages: [{
          role: 'user',
          content: `Generate morning briefing based on these:
          Top Tasks: ${topTasks.map(t => `${t.title} (Score: ${t.priorityScore.toFixed(2)})`).join(', ')}
          Calendar status: ${events.length} events scheduled today.
          Settings: Quiet hours are ${quietHours}`
        }]
      });
      if (response.content[0].type === 'text') {
        return response.content[0].text;
      }
    } catch (e) {
      console.warn("Anthropic API briefing failed, using local builder:", e);
    }
  }

  // Local briefing generator
  const taskCount = topTasks.length;
  if (taskCount === 0) {
    return "Good morning! Your calendar looks clear today. This is an excellent opportunity to focus on long-term goals, establish routine habits, or take some well-deserved restorative downtime. Let me know if you want to schedule anything new.";
  }

  const firstTaskTitle = topTasks[0].title;
  const listItemsText = topTasks.map((t, i) => `${i + 1}. ${t.title}`).join(', ');

  return `Good morning. Today, we are focusing on reducing your cognitive friction. Your primary task is to "${firstTaskTitle}". In total, I've prioritized ${taskCount} key actions for you today: ${listItemsText}. I've dynamically scheduled focus blocks for these in your calendar, avoiding your peak fatigue windows. You also have one automated email hold prepared in your action log; please review and approve it when you're ready. Let's make it a productive day.`;
}
