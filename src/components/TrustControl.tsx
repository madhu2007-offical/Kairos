import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Shield, Clock, Zap, Laptop, MapPin, AlertTriangle, Check, RefreshCw } from 'lucide-react';

export default function TrustControl() {
  const user = useStore((state) => state.user);
  const updateUser = useStore((state) => state.updateUser);
  const simulateTrigger = useStore((state) => state.simulateTrigger);
  const notifications = useStore((state) => state.notifications);
  const clearNotifications = useStore((state) => state.clearNotifications);

  const [saving, setSaving] = useState(false);
  const [autonomy, setAutonomy] = useState<'SUGGEST_ONLY' | 'DRAFT_AND_CONFIRM' | 'FULL_AUTONOMY'>(user?.autonomyLevel || 'DRAFT_AND_CONFIRM');
  const [peakStart, setPeakStart] = useState(user?.peakFocusStart || 9);
  const [peakEnd, setPeakEnd] = useState(user?.peakFocusEnd || 12);
  const [quietStart, setQuietStart] = useState(user?.quietHourStart || 21);
  const [quietEnd, setQuietEnd] = useState(user?.quietHourEnd || 7);

  React.useEffect(() => {
    if (user) {
      setAutonomy(user.autonomyLevel);
      setPeakStart(user.peakFocusStart);
      setPeakEnd(user.peakFocusEnd);
      setQuietStart(user.quietHourStart);
      setQuietEnd(user.quietHourEnd);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setSaving(true);
    await updateUser({
      autonomyLevel: autonomy,
      peakFocusStart: peakStart,
      peakFocusEnd: peakEnd,
      quietHourStart: quietStart,
      quietHourEnd: quietEnd
    });
    setSaving(false);
  };

  const handleSimulate = async (trigger: 'LAPTOP_OPEN' | 'CALENDAR_CONFLICT' | 'LOCATION_CHANGE') => {
    await simulateTrigger(trigger);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-linen-50">Trust & Control Dashboard</h2>
        <p className="text-linen-400 text-xs font-light mt-1">
          Adjust agency scopes, declare peak energy windows, and simulate real-time behavioral events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Configuration (Left 7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Shield className="h-5 w-5 text-sage-400" />
            <h3 className="font-serif text-lg font-bold text-linen-50">Companion Parameters</h3>
          </div>

          {/* Autonomy Radio Card Selectors */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-wider text-linen-400">Autonomy Delegation Scope</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1 */}
              <div
                onClick={() => setAutonomy('SUGGEST_ONLY')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  autonomy === 'SUGGEST_ONLY'
                    ? 'bg-sage-950/40 border-sage-500/50 shadow-md'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="font-semibold text-xs text-linen-100">Suggest Only</div>
                <p className="text-[10px] text-linen-400 font-light mt-1">No automatic drafts or blocks. Strictly notifications feed.</p>
              </div>

              {/* Option 2 */}
              <div
                onClick={() => setAutonomy('DRAFT_AND_CONFIRM')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  autonomy === 'DRAFT_AND_CONFIRM'
                    ? 'bg-sage-950/40 border-sage-500/50 shadow-md'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="font-semibold text-xs text-linen-100">Draft & Confirm</div>
                <p className="text-[10px] text-linen-400 font-light mt-1">Pre-fills emails and timeline locks. Awaits approval.</p>
              </div>

              {/* Option 3 */}
              <div
                onClick={() => setAutonomy('FULL_AUTONOMY')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  autonomy === 'FULL_AUTONOMY'
                    ? 'bg-sage-950/40 border-sage-500/50 shadow-md'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="font-semibold text-xs text-linen-100 flex items-center gap-1">
                  Full Autonomy
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping"></span>
                </div>
                <p className="text-[10px] text-linen-400 font-light mt-1">Commit holds and draft dispatches. Supported by 1-click Undo.</p>
              </div>
            </div>
          </div>

          {/* Energy Audits Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-linen-400">Peak Energy Hours</label>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-linen-300">Peak Start</span>
                    <span className="text-sage-400 font-semibold">{peakStart}:00 AM</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="12"
                    value={peakStart}
                    onChange={(e) => setPeakStart(parseInt(e.target.value))}
                    className="accent-sage-500 w-full h-1 bg-white/15 cursor-pointer rounded-lg appearance-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-linen-300">Peak End</span>
                    <span className="text-sage-400 font-semibold">{peakEnd}:00 PM</span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="18"
                    value={peakEnd}
                    onChange={(e) => setPeakEnd(parseInt(e.target.value))}
                    className="accent-sage-500 w-full h-1 bg-white/15 cursor-pointer rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-linen-400">Quiet Time Hours (Do Not Disturb)</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-linen-500">Quiet Start</span>
                  <select
                    value={quietStart}
                    onChange={(e) => setQuietStart(parseInt(e.target.value))}
                    className="glass-input text-xs py-1.5"
                  >
                    {[18, 19, 20, 21, 22, 23].map((h) => (
                      <option key={h} value={h} className="bg-darkslate-950 text-linen-100">{h}:00 PM</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-linen-500">Quiet End</span>
                  <select
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(parseInt(e.target.value))}
                    className="glass-input text-xs py-1.5"
                  >
                    {[5, 6, 7, 8, 9].map((h) => (
                      <option key={h} value={h} className="bg-darkslate-950 text-linen-100">{h}:00 AM</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="glass-button-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Configuration
            </button>
          </div>
        </div>

        {/* Real-time Simulator (Right 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Triggers simulator */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-sage-400">
              <Zap className="h-5 w-5 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-linen-50">Behavior Simulator</h3>
            </div>
            
            <p className="text-[11px] text-linen-400 font-light leading-relaxed">
              Force trigger asynchronous behavioral context markers to test the companion's proactive rescheduling loops and notification stack.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSimulate('LAPTOP_OPEN')}
                className="w-full text-xs font-semibold py-3 px-4 rounded-xl bg-black/20 hover:bg-black/35 text-linen-200 border border-white/5 flex items-center gap-3 transition-colors"
              >
                <Laptop className="h-4.5 w-4.5 text-sage-400 shrink-0" />
                <div className="text-left">
                  <span>Laptop Opened</span>
                  <span className="text-[9px] text-linen-500 block font-normal">Triggers morning briefing push.</span>
                </div>
              </button>

              <button
                onClick={() => handleSimulate('LOCATION_CHANGE')}
                className="w-full text-xs font-semibold py-3 px-4 rounded-xl bg-black/20 hover:bg-black/35 text-linen-200 border border-white/5 flex items-center gap-3 transition-colors"
              >
                <MapPin className="h-4.5 w-4.5 text-sage-400 shrink-0" />
                <div className="text-left">
                  <span>Context Shift: Arrived Home</span>
                  <span className="text-[9px] text-linen-500 block font-normal">Promotes personal/rec queue items.</span>
                </div>
              </button>

              <button
                onClick={() => handleSimulate('CALENDAR_CONFLICT')}
                className="w-full text-xs font-semibold py-3 px-4 rounded-xl bg-black/20 hover:bg-black/35 text-linen-200 border border-white/5 flex items-center gap-3 transition-colors"
              >
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                <div className="text-left">
                  <span>Ad-hoc Calendar Conflict</span>
                  <span className="text-[9px] text-linen-500 block font-normal">Forces auto-replan and explain-o-meter logs.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Trigger outputs list */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex-grow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Simulated Nudge Queue</span>
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider">
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((nudge) => {
                  let indicatorClass = 'bg-sage-400';
                  if (nudge.type === 'WARNING') indicatorClass = 'bg-red-400';
                  else if (nudge.type === 'REPLAN_SUGGESTION') indicatorClass = 'bg-blue-400';
                  else if (nudge.type === 'AUTONOMOUS_DRAFT') indicatorClass = 'bg-amber-400';

                  return (
                    <div
                      key={nudge.id}
                      className="bg-black/20 rounded-xl p-3 border border-white/5 flex gap-3 text-[10.5px] items-start hover:border-white/10 transition-colors"
                    >
                      <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${indicatorClass}`} />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-linen-100 block">{nudge.title}</span>
                        <p className="text-linen-400 leading-snug font-light">{nudge.message}</p>
                        <span className="text-[9px] text-linen-600 font-medium">
                          {new Date(nudge.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-[10px] text-linen-600 py-6 italic">No notifications generated. Trigger events above to simulate nudges.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
