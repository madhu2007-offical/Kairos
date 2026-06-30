import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Play, Square, Send, Loader2 } from 'lucide-react';

export default function VoiceBriefing() {
  const fetchBriefing = useStore((state) => state.fetchBriefing);
  const addTask = useStore((state) => state.addTask);

  const [briefingText, setBriefingText] = useState('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesisUtterance | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Check Web Speech API support
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceInputText(transcript);
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handlePlayBriefing = async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setLoadingBrief(true);
    let text = briefingText;
    if (!text) {
      text = await fetchBriefing();
      setBriefingText(text);
    }
    setLoadingBrief(false);

    if (text) {
      window.speechSynthesis.cancel(); // Reset active playbacks
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsPlaying(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      setSpeechSynth(utterance);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleListen = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setVoiceInputText('');
      setIsListening(true);
      recognition.start();
    }
  };

  const handleSubmitTask = async () => {
    if (!voiceInputText) return;
    // Call add task with NLP input
    await addTask({
      isNlp: true,
      input: voiceInputText
    });
    setVoiceInputText('');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-linen-50">Natural Speech Interface</h2>
        <p className="text-linen-400 text-xs font-light mt-1">
          Listen to daily briefings compiled by the AI or speak naturally to command scheduler queue updates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playback Morning Briefing (Left Card) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Morning/Evening Briefing</span>
              <Volume2 className="h-4 w-4 text-sage-400" />
            </div>
            
            <h3 className="font-serif text-xl font-bold text-linen-100 mb-3">Sync Ledger Voice Briefing</h3>
            
            {briefingText ? (
              <p className="text-xs text-linen-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 font-light">
                {briefingText}
              </p>
            ) : (
              <p className="text-xs text-linen-500 italic bg-black/10 p-4 rounded-xl border border-white/5">
                Press play below to fetch and render the briefing audio ledger.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handlePlayBriefing}
              disabled={loadingBrief}
              className="glass-button bg-sage-600 hover:bg-sage-500 text-linen-50 text-xs py-2 px-4 flex items-center gap-2 shadow-lg shadow-sage-950/40"
            >
              {loadingBrief ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop Briefing
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Play Briefing
                </>
              )}
            </button>

            {/* Audio Wave Visualizer animation when playing */}
            {isPlaying && (
              <div className="flex items-end gap-1 h-6">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 2, 1].map((h, i) => (
                  <div
                    key={i}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    className="w-[2px] bg-sage-400 rounded-full animate-pulse-slow origin-bottom"
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Speech input task parsing (Right Card) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-medium text-linen-400 uppercase tracking-wider">Voice task input</span>
              <Mic className="h-4 w-4 text-sage-400" />
            </div>

            <h3 className="font-serif text-xl font-bold text-linen-100 mb-3">Speak to Queue</h3>
            <p className="text-xs text-linen-400 font-light leading-relaxed mb-4">
              Speak naturally. Tell Kairos what task you need to do, the deadline, and approximate duration.
            </p>

            <div className="space-y-3 bg-black/25 p-4 rounded-xl border border-white/5">
              <span className="text-[9px] uppercase font-bold tracking-wide text-linen-500 block">Try saying:</span>
              <p className="text-xs italic text-linen-300 font-mono font-light">
                "Submit architectural presentation slides by tomorrow afternoon, need 2 hours"
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {/* Input display */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                placeholder={isListening ? "Listening... Speak now" : "Transcription / Type prompt here..."}
                className="glass-input text-xs flex-grow font-light"
              />
              
              {isRecognitionSupported ? (
                <button
                  onClick={handleListen}
                  className={`p-2.5 rounded-lg border transition-all duration-200 shrink-0 ${
                    isListening
                      ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-linen-300'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-linen-600 cursor-not-allowed shrink-0"
                  title="Speech recognition not supported in this browser."
                >
                  <MicOff className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleSubmitTask}
                disabled={!voiceInputText}
                className="p-2.5 rounded-lg bg-sage-600 hover:bg-sage-500 text-linen-50 border border-sage-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
