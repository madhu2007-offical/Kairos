import React, { useState } from 'react';
import { useStore, Goal, Habit } from '../store/useStore';
import { Target, CheckCircle2, Circle, Flame, Sparkles, Plus, Calendar, Award, Loader2, AlertCircle } from 'lucide-react';

export default function GoalHabitTracker() {
  const goals = useStore((state) => state.goals);
  const habits = useStore((state) => state.habits);
  const addGoal = useStore((state) => state.addGoal);
  const addHabit = useStore((state) => state.addHabit);
  const completeHabit = useStore((state) => state.completeHabit);

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDifficulty, setNewHabitDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isGoalLoading, setIsGoalLoading] = useState(false);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalDate) return;
    setIsGoalLoading(true);
    await addGoal(newGoalTitle, newGoalDate);
    setNewGoalTitle('');
    setNewGoalDate('');
    setIsAddingGoal(false);
    setIsGoalLoading(false);
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName) return;
    await addHabit(newHabitName, 'DAILY', newHabitDifficulty);
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const isHabitCompletedToday = (habit: Habit) => {
    if (!habit.lastCompletedDate) return false;
    return new Date(habit.lastCompletedDate).toDateString() === new Date().toDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-linen-50">Goal Decomposition & Habit Audit</h2>
        <p className="text-linen-400 text-xs font-light mt-1">
          Decompose large milestones into step-by-step tracks, and maintain consistency thresholds adjusted by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goal Decomposition (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Goal Milestone Maps</span>
            <button
              onClick={() => setIsAddingGoal(!isAddingGoal)}
              className="text-xs font-semibold text-sage-400 hover:text-sage-300 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Decompose New Goal
            </button>
          </div>

          {/* Goal Creator Form */}
          {isAddingGoal && (
            <form onSubmit={handleAddGoal} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 animate-fade-in-up bg-darkslate-900/40">
              <h3 className="text-sm font-semibold text-linen-100">Add Goal & Auto-Decompose</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-linen-400">Goal Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build personal portfolio website"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-linen-400">Target Date</label>
                <input
                  type="date"
                  required
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGoalLoading}
                  className="glass-button bg-sage-600 hover:bg-sage-500 text-linen-50 text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {isGoalLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> AI Decomposing...
                    </>
                  ) : 'Compile Milestones'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="glass-button bg-white/5 hover:bg-white/10 text-linen-300 border border-white/5 text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Goals List */}
          {goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif text-xl font-bold text-linen-100">{goal.title}</h4>
                      <div className="flex gap-3 text-[10px] text-linen-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        <span className="uppercase font-semibold text-sage-400 bg-sage-950/40 px-1 border border-sage-900/30 rounded">{goal.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Decomposed Milestones Grid */}
                  <div className="border-t border-white/5 pt-4">
                    <span className="text-[10px] uppercase font-bold tracking-wide text-linen-500 block mb-3">AI Milestone Track</span>
                    
                    <div className="space-y-2.5">
                      {goal.milestones.map((ms, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-black/15 p-3 rounded-lg border border-white/5 text-xs text-linen-200">
                          <div className="flex items-center gap-3">
                            <div className="text-sage-400 bg-sage-950/40 h-5 w-5 rounded-full border border-sage-500/10 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </div>
                            <span>{ms.title}</span>
                          </div>
                          <span className="text-[10px] text-linen-500 shrink-0 font-medium">
                            Day {ms.daysOffset} • {ms.duration}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[250px] text-linen-500">
              <Target className="h-8 w-8 text-linen-600 mb-3" />
              <p className="text-sm font-medium">Decompose major objectives</p>
              <p className="text-xs text-linen-600 mt-1 max-w-[200px]">
                Create a high-level goal and witness the AI decompose it into micro-checkpoints.
              </p>
            </div>
          )}
        </div>

        {/* Habit Streaks & Reflect (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Habits Container */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Consistency Streaks</span>
              <button
                onClick={() => setIsAddingHabit(!isAddingHabit)}
                className="text-xs font-semibold text-sage-400 hover:text-sage-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {/* Habit Form */}
            {isAddingHabit && (
              <form onSubmit={handleAddHabit} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 bg-darkslate-900/40 animate-fade-in-up">
                <input
                  type="text"
                  required
                  placeholder="Habit description"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="glass-input text-xs w-full"
                />
                <div className="flex gap-2">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setNewHabitDifficulty(diff)}
                      className={`flex-grow py-1 rounded text-[10px] font-medium border transition-colors ${
                        newHabitDifficulty === diff 
                          ? 'bg-sage-950 border-sage-500/20 text-sage-300' 
                          : 'bg-black/10 border-white/5 text-linen-400'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="submit" className="glass-button bg-sage-600 text-linen-50 text-[10px] py-1 px-3">
                    Add Streak
                  </button>
                  <button type="button" onClick={() => setIsAddingHabit(false)} className="text-[10px] text-linen-500 px-2 py-1">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Habit list */}
            {habits.length > 0 ? (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const completed = isHabitCompletedToday(habit);
                  
                  // Adaptive difficulty indicator
                  const isHighStreak = habit.streak >= 5;
                  
                  return (
                    <div
                      key={habit.id}
                      className="glass-panel p-4 rounded-xl border border-white/5 flex justify-between items-center gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-linen-100 leading-snug">{habit.name}</span>
                          <span className={`text-[8px] font-extrabold px-1 rounded uppercase tracking-wider ${
                            habit.difficulty === 'EASY' ? 'text-green-400 bg-green-950/20 border border-green-900/10' :
                            habit.difficulty === 'MEDIUM' ? 'text-amber-400 bg-amber-950/20 border border-amber-900/10' :
                            'text-red-400 bg-red-950/20 border border-red-900/10'
                          }`}>
                            {habit.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-linen-500">
                          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                          <span className="font-semibold text-linen-300">{habit.streak} day streak</span>
                          {isHighStreak && (
                            <span
                              className="text-[9px] text-sage-400 flex items-center gap-0.5 cursor-help"
                              title="Streak >= 5: Kairos has raised adaptive consistency targets to match your peak performance velocity."
                            >
                              <Award className="h-3 w-3" /> Adaptive
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => completeHabit(habit.id)}
                        className={`p-2 rounded-xl transition-all duration-200 border ${
                          completed 
                            ? 'bg-sage-600/20 border-sage-500/40 text-sage-300 hover:bg-sage-600/30' 
                            : 'bg-white/5 border-white/5 hover:border-white/10 text-linen-500 hover:text-linen-300'
                        }`}
                      >
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-linen-500 text-xs">No habits tracked.</div>
            )}
          </div>

          {/* Weekly Reflection */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sage-400">
              <Sparkles className="h-4.5 w-4.5" />
              <h3 className="font-serif text-sm font-bold text-linen-50">AI Weekly Reflection Summary</h3>
            </div>
            <p className="text-[10.5px] leading-relaxed text-linen-300 font-light bg-black/25 p-4 rounded-xl border border-white/5">
              "Focus execution velocity remains **high** this week, completing blocks at an average velocity of 1.4x scheduled speeds. Habit consistency audits show a **100% adherence** on aerobic exercises, triggering adaptive difficulty adjustments. Let's shift tomorrow's deep work blocks to mornings to capture your peak energy hours."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
