import React from 'react';
import { useStore, AutonomousAction } from '../store/useStore';
import { Shield, Sparkles, Check, X, RotateCcw, Mail, Calendar, Eye, EyeOff } from 'lucide-react';

export default function AutonomousActionLog() {
  const actions = useStore((state) => state.actions);
  const approveAction = useStore((state) => state.approveAction);
  const rejectAction = useStore((state) => state.rejectAction);
  const undoAction = useStore((state) => state.undoAction);

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const pendingActions = actions.filter(a => a.state === 'PENDING');
  const pastActions = actions.filter(a => a.state !== 'PENDING');

  const handleApprove = async (id: string) => {
    await approveAction(id);
  };

  const handleReject = async (id: string) => {
    await rejectAction(id);
  };

  const handleUndo = async (id: string) => {
    await undoAction(id);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-linen-50">Bounded Agency Logs</h2>
        <p className="text-linen-400 text-xs font-light mt-1">
          Full audit transparency. Actions are staged as drafts and require your manual approval to execute (unless Full Autonomy is granted).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Actions (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Pending Approvals</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
              {pendingActions.length} Actions Staged
            </span>
          </div>

          {pendingActions.length > 0 ? (
            <div className="space-y-4">
              {pendingActions.map((act) => (
                <div
                  key={act.id}
                  className="glass-panel p-6 rounded-2xl border-l-4 border-amber-400/60 shadow-lg shadow-amber-950/10 space-y-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-950/30 border border-amber-900/30 flex items-center justify-center text-amber-400 shrink-0">
                        {act.type === 'EMAIL_DRAFT' ? <Mail className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-linen-50 leading-snug">{act.title}</h4>
                        <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold bg-amber-950/30 px-1 rounded">
                          {act.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation of why this action was drafted */}
                  <p className="text-xs text-linen-300 font-light leading-relaxed bg-black/10 p-3 rounded-lg flex gap-2">
                    <Sparkles className="h-4 w-4 text-sage-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-sage-300">Reasoning:</strong> {act.explanation}
                    </span>
                  </p>

                  {/* Toggle Draft Contents Preview */}
                  <div className="border-t border-white/5 pt-3">
                    <button
                      onClick={() => setExpandedId(expandedId === act.id ? null : act.id)}
                      className="flex items-center gap-1.5 text-[10px] text-linen-400 hover:text-linen-200 transition-colors uppercase tracking-wider font-semibold"
                    >
                      {expandedId === act.id ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Collapse Draft Content
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> View Draft Content
                        </>
                      )}
                    </button>

                    {expandedId === act.id && (
                      <div className="mt-3 bg-black/20 rounded-lg border border-white/5 p-4 space-y-3 font-mono text-[10px] text-linen-300">
                        {act.type === 'EMAIL_DRAFT' ? (
                          <>
                            <div>
                              <span className="text-linen-500">To:</span> {act.details.recipient}
                            </div>
                            <div>
                              <span className="text-linen-500">Subject:</span> {act.details.subject}
                            </div>
                            <div className="border-t border-white/5 pt-2 whitespace-pre-wrap">
                              {act.details.body}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-linen-500">Scheduled Hold:</span>
                            </div>
                            <div>
                              <span className="text-linen-500">Start:</span> {act.details.start && new Date(act.details.start).toLocaleString()}
                            </div>
                            <div>
                              <span className="text-linen-500">End:</span> {act.details.end && new Date(act.details.end).toLocaleString()}
                            </div>
                            <div className="border-t border-white/5 pt-2 text-linen-400 italic">
                              {act.details.description}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Decision Controls */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(act.id)}
                      className="flex-grow glass-button bg-sage-600 hover:bg-sage-500 text-linen-50 text-xs py-2 shadow-md shadow-sage-950/40"
                    >
                      <Check className="h-4 w-4" /> Approve & Execute
                    </button>
                    <button
                      onClick={() => handleReject(act.id)}
                      className="glass-button bg-white/5 hover:bg-white/10 text-linen-300 border border-white/5 text-xs py-2"
                    >
                      <X className="h-4 w-4 text-linen-400" /> Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[250px] text-linen-500">
              <Shield className="h-8 w-8 text-linen-600 mb-3" />
              <p className="text-sm font-medium">Clear Action Logs</p>
              <p className="text-xs text-linen-600 mt-1 max-w-[200px]">
                No pending holds or drafts. Kairos triggers holds automatically when critical deadlines near.
              </p>
            </div>
          )}
        </div>

        {/* Audit Trail / Past Actions (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Audit Log</span>
          </div>

          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            {pastActions.length > 0 ? (
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {pastActions.map((act) => {
                  let stateLabel = 'Executed';
                  let stateClass = 'text-sage-400 bg-sage-950/30 border-sage-500/20';
                  
                  if (act.state === 'REJECTED') {
                    stateLabel = 'Dismissed';
                    stateClass = 'text-linen-500 bg-black/30 border-white/5';
                  } else if (act.state === 'UNDONE') {
                    stateLabel = 'Undone';
                    stateClass = 'text-red-400 bg-red-950/20 border-red-900/10';
                  }

                  return (
                    <div key={act.id} className="p-4 space-y-2 text-xs hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-linen-100 block max-w-[180px] truncate leading-tight">
                          {act.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${stateClass}`}>
                          {stateLabel}
                        </span>
                      </div>

                      <p className="text-[10px] text-linen-400 line-clamp-2 leading-relaxed">
                        {act.explanation}
                      </p>

                      {/* 1-Click Undo control */}
                      {act.state === 'EXECUTED' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleUndo(act.id)}
                            className="flex items-center gap-1 text-[9px] font-semibold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider bg-red-950/20 border border-red-900/10 px-2 py-1 rounded"
                          >
                            <RotateCcw className="h-2.5 w-2.5" /> Undo Action
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-linen-500 text-xs">
                No past transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
