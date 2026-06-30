import React, { useState } from 'react';
import { useStore, ScheduleBlock } from '../store/useStore';
import { Calendar, Clock, Lock, Unlock, ArrowRightLeft, Sparkles, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

export default function ScheduleCalendar() {
  const schedule = useStore((state) => state.schedule);
  const replanLog = useStore((state) => state.replanLog);
  const replanSchedule = useStore((state) => state.replanSchedule);
  const updateScheduleBlock = useStore((state) => state.updateScheduleBlock);
  const deleteScheduleBlock = useStore((state) => state.deleteScheduleBlock);

  const [isReplanning, setIsReplanning] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [shiftMinutes, setShiftMinutes] = useState(30);

  const handleReplan = async () => {
    setIsReplanning(true);
    // Simulate thinking animation
    setTimeout(async () => {
      await replanSchedule();
      setIsReplanning(false);
    }, 1500);
  };

  const handleShiftBlock = async (block: ScheduleBlock, minutes: number) => {
    const originalStart = new Date(block.start);
    const originalEnd = new Date(block.end);
    
    const newStart = new Date(originalStart.getTime() + minutes * 60 * 1000);
    const newEnd = new Date(originalEnd.getTime() + minutes * 60 * 1000);

    await updateScheduleBlock(block.id, newStart.toISOString(), newEnd.toISOString(), true);
    setEditingBlock(null);
  };

  const handleToggleLock = async (block: ScheduleBlock) => {
    await updateScheduleBlock(block.id, block.start, block.end, !block.isLocked);
  };

  // Sort schedule chronologically
  const sortedBlocks = [...schedule].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Helper to format time nicely
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-linen-50">Adaptive Timeline</h2>
          <p className="text-linen-400 text-xs font-light mt-1">
            Autonomous schedule balancing. Locks denote manual overrides that subsequent replans will respect.
          </p>
        </div>
        
        <button
          onClick={handleReplan}
          disabled={isReplanning}
          className="glass-button bg-sage-600 hover:bg-sage-500 text-linen-50 text-xs px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-sage-950/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReplanning ? 'animate-spin' : ''}`} />
          {isReplanning ? 'AI Optimizing Calendar...' : 'Trigger Smart Replan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Schedule Timeline (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {isReplanning ? (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[350px]">
              <LoaderIcon className="h-10 w-10 text-sage-400 animate-spin mb-4" />
              <h3 className="font-serif text-xl font-medium text-linen-200">Rebalancing Focus blocks...</h3>
              <p className="text-linen-500 text-xs mt-1 max-w-[280px]">
                Calculating opportunity costs of outstanding tasks and avoiding your quiet hours.
              </p>
            </div>
          ) : sortedBlocks.length > 0 ? (
            <div className="relative border-l border-white/10 pl-6 space-y-4 ml-3 py-2">
              {sortedBlocks.map((block) => {
                // Determine colors based on block type
                let colorClass = 'border-linen-700 bg-white/5 text-linen-200';
                if (block.type === 'MEETING') colorClass = 'border-red-500/40 bg-red-950/10 text-red-200';
                else if (block.type === 'FOCUS') colorClass = 'border-sage-500/40 bg-sage-950/15 text-sage-200';
                else if (block.type === 'BUFFER') colorClass = 'border-amber-500/30 bg-amber-950/10 text-amber-200';
                
                return (
                  <div key={block.id} className="relative group">
                    {/* Node Dot on vertical timeline line */}
                    <div className={`absolute -left-[31px] top-4 h-3.5 w-3.5 rounded-full border-2 bg-darkslate-950 transition-colors ${
                      block.type === 'MEETING' ? 'border-red-500' : block.type === 'FOCUS' ? 'border-sage-500' : 'border-linen-500'
                    }`}></div>

                    {/* Timeline Block Card */}
                    <div className={`glass-panel p-5 rounded-xl border-l-4 ${colorClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 hover:bg-white/10`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-linen-50 text-sm tracking-wide">{block.title}</span>
                          {block.isLocked && (
                            <span className="flex items-center text-[9px] text-amber-400 font-medium gap-1 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/30">
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-[10px] text-linen-500">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(block.start)} - {formatTime(block.end)}</span>
                          <span className="uppercase tracking-wider font-bold text-[8px] bg-black/30 px-1 rounded">{block.type}</span>
                        </div>
                      </div>

                      {/* Manual Override Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {block.type !== 'MEETING' && (
                          <>
                            <button
                              onClick={() => setEditingBlock(editingBlock?.id === block.id ? null : block)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-linen-400 hover:text-linen-100 transition-colors"
                              title="Manual Override Shift"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleLock(block)}
                              className={`p-1.5 rounded transition-colors ${
                                block.isLocked 
                                  ? 'bg-amber-950/20 text-amber-400 hover:bg-amber-900/30' 
                                  : 'bg-white/5 text-linen-500 hover:text-linen-300'
                              }`}
                              title={block.isLocked ? "Unlock Slot" : "Lock Slot"}
                            >
                              {block.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteScheduleBlock(block.id)}
                          className="p-1.5 rounded bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Hold"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit overlay for shifting slot */}
                    {editingBlock?.id === block.id && (
                      <div className="mt-2 glass-panel p-4 rounded-xl border border-white/15 bg-darkslate-900/90 text-xs space-y-3 max-w-sm absolute right-0 z-20 shadow-xl animate-fade-in-up">
                        <p className="font-semibold text-linen-200">Manual Shift Override</p>
                        <p className="text-[10px] text-linen-500">Shifting locks the block, protecting it from auto-replan re-shuffles.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShiftBlock(block, -30)}
                            className="flex-grow py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-linen-300"
                          >
                            -30 Min
                          </button>
                          <button
                            onClick={() => handleShiftBlock(block, 30)}
                            className="flex-grow py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-linen-300"
                          >
                            +30 Min
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShiftBlock(block, 60)}
                            className="flex-grow py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-linen-300"
                          >
                            +1 Hour
                          </button>
                          <button
                            onClick={() => setEditingBlock(null)}
                            className="py-1.5 px-3 rounded bg-red-950/30 text-red-300 hover:bg-red-900/40"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[300px] text-linen-500">
              <Calendar className="h-10 w-10 text-linen-600 mb-4" />
              <h3 className="font-serif text-lg font-medium text-linen-200">No calendar holds today</h3>
              <p className="text-xs text-linen-600 mt-1 max-w-[240px]">
                Click "Trigger Smart Replan" above to run the scheduler compiler on your active task queue.
              </p>
            </div>
          )}
        </div>

        {/* AI Explain-o-meter (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sage-400">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-serif text-lg font-bold text-linen-50">Explain-o-meter</h3>
            </div>
            
            <p className="text-[11px] text-linen-400 font-light leading-relaxed">
              Whenever the AI updates your calendar (e.g. after adding tasks, missed deadlines, or location shifts), the reasoning ledger records the parameters evaluated.
            </p>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-wide text-linen-500">Timeline Decision Audit Log</div>
              
              {replanLog ? (
                <div className="bg-black/25 rounded-xl p-4 border border-white/5 font-mono text-[10px] leading-relaxed text-linen-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {replanLog}
                </div>
              ) : (
                <div className="bg-black/10 rounded-xl p-4 border border-white/5 flex items-center gap-2 text-[10px] text-linen-500">
                  <AlertCircle className="h-3.5 w-3.5 text-linen-600 shrink-0" />
                  <span>No active replan log. Run "Trigger Smart Replan" to compile calendar logs.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple icons
function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
