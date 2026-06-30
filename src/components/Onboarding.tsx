import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, User, Sliders, Shield, Check, Info, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Elena Rostova');
  const [autonomy, setAutonomy] = useState<'SUGGEST_ONLY' | 'DRAFT_AND_CONFIRM' | 'FULL_AUTONOMY'>('DRAFT_AND_CONFIRM');
  const [peakStart, setPeakStart] = useState(9);
  const [peakEnd, setPeakEnd] = useState(12);
  const [syncState, setSyncState] = useState<'IDLE' | 'CONNECTING' | 'SYNCING' | 'DONE'>('IDLE');

  const updateUser = useStore((state) => state.updateUser);
  const setOnboardingCompleted = useStore((state) => state.setOnboardingCompleted);

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save to store & database
      await updateUser({
        name,
        autonomyLevel: autonomy,
        peakFocusStart: peakStart,
        peakFocusEnd: peakEnd,
        calendarConnected: true,
      });
      // Set completed
      setOnboardingCompleted(true);
      onComplete();
    }
  };

  const handleSyncCalendar = () => {
    setSyncState('CONNECTING');
    setTimeout(() => {
      setSyncState('SYNCING');
      setTimeout(() => {
        setSyncState('DONE');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-darkslate-950 text-linen-100 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-600/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl glass-panel p-10 rounded-3xl relative z-10 animate-fade-in-up">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-grow rounded-full transition-all duration-300 ${
                s <= step ? 'bg-sage-500 shadow-md shadow-sage-500/20' : 'bg-white/5'
              }`}
            ></div>
          ))}
        </div>

        {/* Step 1: User Profile */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 text-sage-400 mb-4">
              <User className="h-6 w-6" />
              <span className="text-sm font-medium tracking-wider uppercase">Identity</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-linen-50 mb-4">Tell us your name.</h2>
            <p className="text-linen-400 font-light text-sm mb-6 leading-relaxed">
              Kairos references you personally in briefings and aligns work notifications to your context.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-linen-400">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input text-base"
                placeholder="e.g. Elena Rostova"
              />
            </div>
          </div>
        )}

        {/* Step 2: Peak Energy Audit */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 text-sage-400 mb-4">
              <Sliders className="h-6 w-6" />
              <span className="text-sm font-medium tracking-wider uppercase">Energy Audit</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-linen-50 mb-4">When do you focus best?</h2>
            <p className="text-linen-400 font-light text-sm mb-6 leading-relaxed">
              Kairos schedules complex deep-work blocks during your peak cognitive periods and buffers low-intensity tasks in fatigue slumps.
            </p>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-linen-300">Peak Window Start</span>
                  <span className="text-sage-400 font-medium">{peakStart}:00 AM</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="14"
                  value={peakStart}
                  onChange={(e) => setPeakStart(parseInt(e.target.value))}
                  className="w-full accent-sage-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-linen-300">Peak Window End</span>
                  <span className="text-sage-400 font-medium">{peakEnd}:00 PM</span>
                </div>
                <input
                  type="range"
                  min="11"
                  max="18"
                  value={peakEnd}
                  onChange={(e) => setPeakEnd(parseInt(e.target.value))}
                  className="w-full accent-sage-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Autonomy Level */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 text-sage-400 mb-4">
              <Shield className="h-6 w-6" />
              <span className="text-sm font-medium tracking-wider uppercase">Autonomy Settings</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-linen-50 mb-4">Determine AI agency.</h2>
            <p className="text-linen-400 font-light text-sm mb-6 leading-relaxed">
              How much autonomous behavior would you like to delegate to Kairos? You can adjust this globally at any time.
            </p>

            <div className="space-y-4">
              {/* Option A */}
              <div
                onClick={() => setAutonomy('SUGGEST_ONLY')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  autonomy === 'SUGGEST_ONLY'
                    ? 'bg-sage-950/40 border-sage-500/60 shadow-lg'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-linen-100">Suggest Only</span>
                  {autonomy === 'SUGGEST_ONLY' && <Check className="h-4 w-4 text-sage-400" />}
                </div>
                <p className="text-xs text-linen-400 font-light">
                  Kairos displays recommendations in a feed. No actions or holds are committed without manual input.
                </p>
              </div>

              {/* Option B */}
              <div
                onClick={() => setAutonomy('DRAFT_AND_CONFIRM')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  autonomy === 'DRAFT_AND_CONFIRM'
                    ? 'bg-sage-950/40 border-sage-500/60 shadow-lg'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-linen-100">Draft & Confirm (Recommended)</span>
                  {autonomy === 'DRAFT_AND_CONFIRM' && <Check className="h-4 w-4 text-sage-400" />}
                </div>
                <p className="text-xs text-linen-400 font-light">
                  Kairos pre-drafts emails, pre-fills forms, and parks tentative calendar locks. Action goes live only after user tap-approval.
                </p>
              </div>

              {/* Option C */}
              <div
                onClick={() => setAutonomy('FULL_AUTONOMY')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  autonomy === 'FULL_AUTONOMY'
                    ? 'bg-sage-950/40 border-sage-500/60 shadow-lg'
                    : 'bg-black/10 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-linen-100 flex items-center gap-1.5">
                    Full Autonomy
                    <span className="px-1.5 py-0.5 rounded bg-red-950/50 border border-red-900/30 text-[9px] font-medium text-red-300">High Trust</span>
                  </span>
                  {autonomy === 'FULL_AUTONOMY' && <Check className="h-4 w-4 text-sage-400" />}
                </div>
                <p className="text-xs text-linen-400 font-light">
                  Kairos automatically books calendar holds and drafts/sends alignment logs. Safe limits apply, backed by 1-click Undo actions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Calendar Connection */}
        {step === 4 && (
          <div>
            <div className="flex items-center gap-3 text-sage-400 mb-4">
              <Calendar className="h-6 w-6" />
              <span className="text-sm font-medium tracking-wider uppercase">Integration</span>
            </div>
            <h2 className="font-serif text-3xl font-bold text-linen-50 mb-4">Sync your schedule.</h2>
            <p className="text-linen-400 font-light text-sm mb-6 leading-relaxed">
              Connect Google Calendar or Outlook. Kairos audits current meetings, detects upcoming conflicts, and aligns tasks.
            </p>

            <div className="bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[180px] text-center">
              {syncState === 'IDLE' && (
                <>
                  <Calendar className="h-10 w-10 text-linen-500 mb-4" />
                  <button
                    onClick={handleSyncCalendar}
                    className="glass-button-primary w-full"
                  >
                    Sync Calendar Accounts
                  </button>
                </>
              )}

              {syncState === 'CONNECTING' && (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-sage-400 animate-spin mb-4" />
                  <p className="font-medium text-linen-200">Opening OAuth Gateway...</p>
                  <p className="text-xs text-linen-500 mt-1">Connecting to authentication provider</p>
                </div>
              )}

              {syncState === 'SYNCING' && (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-sage-400 animate-spin mb-4" />
                  <p className="font-medium text-linen-200">Auditing Schedule Gaps...</p>
                  <p className="text-xs text-linen-500 mt-1">Syncing recurring events and slots</p>
                </div>
              )}

              {syncState === 'DONE' && (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-sage-950 border border-sage-500/20 flex items-center justify-center text-sage-400 mb-4">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-linen-100">Calendar Linked Successfully</p>
                  <p className="text-xs text-sage-400 mt-1">Imported 1 sync block: "Daily Standup & Sync"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1 || syncState === 'CONNECTING' || syncState === 'SYNCING'}
            className="text-sm font-medium text-linen-500 hover:text-linen-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={step === 4 && syncState !== 'DONE'}
            className="glass-button-primary px-6"
          >
            {step === 4 ? 'Personalize Companion' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
