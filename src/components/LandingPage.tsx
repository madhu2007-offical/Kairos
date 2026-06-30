import React from 'react';
import { ArrowRight, Calendar, ShieldAlert, Sparkles, Clock, Target } from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
}

export default function LandingPage({ onStartOnboarding }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-darkslate-950 text-linen-100 flex flex-col justify-between selection:bg-sage-500/20">
      {/* Top Decorative Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sage-600/10 rounded-full filter blur-3xl pointer-events-none animation-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-linen-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sage-600 to-sage-400 flex items-center justify-center text-linen-50 shadow-md shadow-sage-950/40">
            <span className="font-serif font-bold text-xl tracking-tight">K</span>
          </div>
          <span className="font-serif text-2xl font-semibold tracking-wide text-linen-50">kairos</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onStartOnboarding}
            className="glass-button bg-white/5 hover:bg-white/10 text-linen-200 text-sm border border-white/5"
          >
            Launch Web App
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center z-10 flex-grow">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-900/50 border border-sage-500/20 text-sage-300 text-xs font-medium mb-8 animate-fade-in-up">
          <Sparkles className="h-3.5 w-3.5 text-sage-400" />
          <span>A New Philosophy of Time Management</span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-linen-50 max-w-4xl leading-[1.1] mb-6 animate-fade-in-up">
          The productivity companion that <span className="text-sage-400 font-semibold italic glow-text">executes</span> before you fall behind.
        </h1>

        <p className="text-linen-400 text-lg md:text-xl max-w-2xl font-light mb-12 leading-relaxed animate-fade-in-up">
          Most apps remind you of what you missed. Kairos proactively schedules focus blocks, drafts emails, and handles administrative tasks to keep you ahead of competing deadlines.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-20 animate-fade-in-up">
          <button 
            onClick={onStartOnboarding}
            className="w-full sm:w-auto glass-button-primary text-base px-8 py-3.5 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Enter Onboarding
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          {/* Card 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-sage-500/20 transition-all duration-300 group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-sage-950 border border-sage-500/10 flex items-center justify-center text-sage-400 mb-6 group-hover:border-sage-500/40 transition-colors">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-linen-50 mb-3">Adaptive Scheduling</h3>
              <p className="text-linen-400 font-light text-sm leading-relaxed">
                Kairos updates schedule blocks in real-time when meetings overrun or priorities shift, protecting your peak focus hours.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-sage-500/20 transition-all duration-300 group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-sage-950 border border-sage-500/10 flex items-center justify-center text-sage-400 mb-6 group-hover:border-sage-500/40 transition-colors">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-linen-50 mb-3">Opportunistic Priority Engine</h3>
              <p className="text-linen-400 font-light text-sm leading-relaxed">
                Calculates task priority using deadline urgency, dependency networks, and opportunity cost of delay, explaining why each task ranks where it does.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-sage-500/20 transition-all duration-300 group">
            <div>
              <div className="h-12 w-12 rounded-xl bg-sage-950 border border-sage-500/10 flex items-center justify-center text-sage-400 mb-6 group-hover:border-sage-500/40 transition-colors">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-medium text-linen-50 mb-3">Bounded Bounded Agency</h3>
              <p className="text-linen-400 font-light text-sm leading-relaxed">
                Autonomously drafts outreach emails and blocks calendars. You remain in complete control with 1-click approvals and full audit undo.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-darkslate-950/80 z-10">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-linen-500 text-xs gap-4">
          <p>© 2026 Kairos Technologies. Crafted for deep focus.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-linen-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-linen-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-linen-300 transition-colors">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
