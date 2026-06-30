import React, { useState } from 'react';
import { useStore, Task } from '../store/useStore';
import { Sparkles, RefreshCw, Layers, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';

export default function PriorityMatrix() {
  const tasks = useStore((state) => state.tasks);
  const loading = useStore((state) => state.loading);
  const reCalculatePriorities = useStore((state) => state.reCalculatePriorities);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const deleteTask = useStore((state) => state.deleteTask);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const handleRecalculate = async () => {
    await reCalculatePriorities();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-linen-50">Opportunistic Priority Spectrum</h2>
          <p className="text-linen-400 text-xs font-light mt-1">
            Dynamic queue compiled using deadline density, dependencies, and delay opportunity cost.
          </p>
        </div>
        
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="glass-button-secondary text-xs px-3.5 py-2 flex items-center gap-2 border border-white/5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate AI Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Priority Matrix (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Opportunity Mapping (Urgency vs. Importance)</span>
            <div className="flex items-center gap-4 text-[10px] text-linen-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400"></span>Critical</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400"></span>High Focus</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sage-400"></span>Routine</span>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative flex-grow flex items-center justify-center bg-black/10 rounded-xl border border-white/5 p-4 select-none">
            {/* Horizontal Axis (Urgency) */}
            <div className="absolute bottom-2 left-10 right-4 h-[1px] bg-white/10 flex justify-between items-center text-[9px] text-linen-600 px-2">
              <span>Low Urgency</span>
              <span className="font-medium uppercase tracking-wider text-linen-500">Urgency</span>
              <span>High Urgency</span>
            </div>
            
            {/* Vertical Axis (Importance) */}
            <div className="absolute left-10 top-4 bottom-10 w-[1px] bg-white/10 flex flex-col justify-between items-center text-[9px] text-linen-600 py-2">
              <span>High Importance</span>
              <span className="font-medium uppercase tracking-wider text-linen-500 origin-center rotate-270 -translate-y-1">Importance</span>
              <span>Low Importance</span>
            </div>

            {/* Quadrant Labels */}
            <div className="absolute top-4 right-4 text-[9px] text-red-400/40 uppercase font-semibold">Immediate Execution</div>
            <div className="absolute top-4 left-14 text-[9px] text-amber-400/40 uppercase font-semibold">Strategic Planning</div>
            <div className="absolute bottom-8 right-4 text-[9px] text-linen-500/40 uppercase font-semibold">Quick Wins</div>
            <div className="absolute bottom-8 left-14 text-[9px] text-linen-600/40 uppercase font-semibold">Low Opportunity Cost</div>

            {/* Scatter Dots Wrapper */}
            <svg className="w-full h-[280px] pl-10 pb-8 overflow-visible">
              {/* Grid Lines */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

              {/* Task Dots */}
              {activeTasks.map((task) => {
                // Map coordinates: Urgency 0-1 to X 5% to 95%, Importance 0-1 to Y 95% to 5%
                const xVal = 5 + (task.urgency * 90);
                const yVal = 95 - (task.importance * 90);
                
                // Color depending on score
                let dotColor = '#5e8574'; // sage
                if (task.priorityScore > 0.75) dotColor = '#f87171'; // red
                else if (task.priorityScore > 0.55) dotColor = '#fbbf24'; // amber

                const isSelected = selectedTask?.id === task.id;
                const isHovered = hoveredTask?.id === task.id;

                return (
                  <g
                    key={task.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedTask(task)}
                    onMouseEnter={() => setHoveredTask(task)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Ring highlight on selection / hover */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={`${xVal}%`}
                        cy={`${yVal}%`}
                        r={isSelected ? 16 : 12}
                        fill="none"
                        stroke={dotColor}
                        strokeWidth="2"
                        className="animate-ping opacity-25"
                      />
                    )}
                    {/* Main Dot */}
                    <circle
                      cx={`${xVal}%`}
                      cy={`${yVal}%`}
                      r={isSelected ? 8 : 6}
                      fill={dotColor}
                      className="transition-all duration-300 hover:r-8 filter drop-shadow-[0_0_8px_rgba(94,133,116,0.5)]"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Float Tooltip for hover */}
            {hoveredTask && (
              <div className="absolute top-2 left-12 right-2 glass-panel p-3 rounded-lg border border-white/10 text-xs shadow-lg max-w-sm pointer-events-none">
                <p className="font-semibold text-linen-100">{hoveredTask.title}</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-linen-400">
                  <span>AI Score: <strong className="text-sage-300">{(hoveredTask.priorityScore * 100).toFixed(0)}</strong></span>
                  <span>Due: <strong>{new Date(hoveredTask.deadline).toLocaleDateString()}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Task Details & Controls (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {selectedTask ? (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5 animate-fade-in-up">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sage-950 border border-sage-500/20 text-sage-300">
                  {selectedTask.context}
                </span>
                <span className="text-[10px] font-medium text-linen-500">
                  Created {new Date(selectedTask.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-linen-50 leading-tight">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-linen-400">
                  <Clock className="h-3.5 w-3.5 text-sage-400" />
                  <span>Duration: {selectedTask.duration} mins</span>
                  <span className="text-linen-600">•</span>
                  <Calendar className="h-3.5 w-3.5 text-sage-400" />
                  <span>Due: {new Date(selectedTask.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>

              {/* AI Scores break downs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-black/10 rounded-lg p-2.5 border border-white/5">
                  <div className="text-[10px] text-linen-500">Urgency</div>
                  <div className="text-sm font-semibold text-linen-200">{(selectedTask.urgency * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-black/10 rounded-lg p-2.5 border border-white/5">
                  <div className="text-[10px] text-linen-500">Importance</div>
                  <div className="text-sm font-semibold text-linen-200">{(selectedTask.importance * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-black/10 rounded-lg p-2.5 border border-white/5">
                  <div className="text-[10px] text-linen-500">Opportunity Cost</div>
                  <div className="text-sm font-semibold text-linen-200">{(selectedTask.opportunityCost * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-black/10 rounded-lg p-2.5 border border-white/5">
                  <div className="text-[10px] text-linen-500">Dynamic Score</div>
                  <div className="text-sm font-semibold text-sage-300">{(selectedTask.priorityScore * 100).toFixed(0)}%</div>
                </div>
              </div>

              {/* Explain panel */}
              {selectedTask.explanation && (
                <div className="bg-sage-950/20 border border-sage-500/10 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-linen-300">
                  <Sparkles className="h-4 w-4 text-sage-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-sage-300">Kairos Reasoning:</span>{' '}
                    {selectedTask.explanation}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    updateTaskStatus(selectedTask.id, 'COMPLETED');
                    setSelectedTask(null);
                  }}
                  className="flex-grow glass-button bg-sage-600 hover:bg-sage-500 text-linen-50 text-xs py-2"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => {
                    deleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="glass-button bg-red-950/30 hover:bg-red-900/40 text-red-200 border border-red-900/10 text-xs py-2 px-3"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[300px] text-linen-500">
              <Layers className="h-8 w-8 text-linen-600 mb-3" />
              <p className="text-sm font-medium">Select a node in the graph</p>
              <p className="text-xs text-linen-600 mt-1 max-w-[200px]">
                Auditing specific nodes exposes scores, deadline buffers, and AI scheduling reasoning.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task List Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-serif text-lg font-semibold text-linen-50">Active Focus Backlog</h3>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-linen-400">
            {activeTasks.length} pending tasks
          </span>
        </div>

        {activeTasks.length > 0 ? (
          <div className="divide-y divide-white/5 overflow-x-auto">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-colors ${
                  selectedTask?.id === task.id ? 'bg-sage-950/20' : 'hover:bg-white/5'
                }`}
              >
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-linen-100 text-sm">{task.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/20 text-linen-400">
                      {task.context}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-linen-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.duration} min</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-linen-500 block">AI Priority</span>
                    <span className={`text-xs font-bold ${
                      task.priorityScore > 0.75 ? 'text-red-400 animate-pulse' : task.priorityScore > 0.55 ? 'text-amber-400' : 'text-sage-400'
                    }`}>
                      {(task.priorityScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, 'COMPLETED');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sage-600/10 hover:bg-sage-600 border border-sage-500/20 hover:border-sage-500/30 text-sage-300 hover:text-linen-50 text-[10px] font-medium transition-colors"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-linen-500 text-sm">
            <CheckCircle className="h-8 w-8 text-sage-500 mx-auto mb-2" />
            No active tasks. Your schedule is clear.
          </div>
        )}
      </div>
    </div>
  );
}

// Simple local fallback icon
function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
