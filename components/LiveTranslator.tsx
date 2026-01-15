import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Speaker, TranscriptItem, SavedSession } from '../types';
import { MODEL_NAME, SAMPLE_RATE_INPUT, SAMPLE_RATE_OUTPUT, AUTOMOTIVE_GLOSSARY } from '../constants';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { saveSession } from '../services/storage';
import { Mic, MicOff, Save, Activity, Settings, Volume2, VolumeX, Type, X } from 'lucide-react';
import clsx from 'clsx';

interface LiveTranslatorProps {
  speakers: [Speaker, Speaker];
  onEndSession: () => void;
}

export const LiveTranslator: React.FC<LiveTranslatorProps> = ({ speakers, onEndSession }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Input mute
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentText, setCurrentText] = useState<{user: string, model: string}>({ user: '', model: '' });
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [ttsEnabled, setTtsEnabled] = useState(false); // Default to muted
  const [ttsVolume, setTtsVolume] = useState(1);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'huge'>('large');

  // Refs for audio handling
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Construct System Instruction with Glossary
  const systemInstruction = useMemo(() => {
    const s1 = speakers[0];
    const s2 = speakers[1];
    return `
      You are a specialized automotive sales interpreter.
      
      ROLES:
      1. Agent (Salesperson): Speaks "${s1.language}".
      2. Customer: Speaks "${s2.language}".
      
      TASK:
      - Listen to input.
      - If input is ${s1.language}, translate to ${s2.language}.
      - If input is ${s2.language}, translate to ${s1.language}.
      
      ${AUTOMOTIVE_GLOSSARY}
      
      PROTOCOL:
      - Concise, professional translation.
      - No intro/outro.
      - Pure translation only.
    `;
  }, [speakers]);

  // Handle Audio Gain Updates
  useEffect(() => {
    if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = ttsEnabled ? ttsVolume : 0;
    }
  }, [ttsEnabled, ttsVolume]);

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: SAMPLE_RATE_INPUT,
        });
        outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: SAMPLE_RATE_OUTPUT,
        });

        // Setup Output Gain Node
        if (outputContextRef.current) {
            const ctx = outputContextRef.current;
            const gainNode = ctx.createGain();
            gainNode.gain.value = ttsEnabled ? ttsVolume : 0; // Initialize
            gainNode.connect(ctx.destination);
            gainNodeRef.current = gainNode;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: MODEL_NAME,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              setIsConnected(true);
              
              if (inputContextRef.current) {
                const ctx = inputContextRef.current;
                const source = ctx.createMediaStreamSource(stream);
                const processor = ctx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                  if (isMuted) return;
                  const inputData = e.inputBuffer.getChannelData(0);
                  
                  // Volume Meter
                  let sum = 0;
                  for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                  const rms = Math.sqrt(sum / inputData.length);
                  setAudioLevel(Math.min(100, rms * 1000));

                  const pcmBlob = createPcmBlob(inputData);
                  sessionPromise.then(session => {
                      session.sendRealtimeInput({ media: pcmBlob });
                  });
                };

                source.connect(processor);
                processor.connect(ctx.destination);
                sourceRef.current = source;
                processorRef.current = processor;
              }
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (!mounted) return;

              // Audio Output
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputContextRef.current && gainNodeRef.current) {
                const ctx = outputContextRef.current;
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx, SAMPLE_RATE_OUTPUT);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                
                // Connect to Gain Node instead of direct destination
                source.connect(gainNodeRef.current);
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                audioQueueRef.current.push(source);
                source.onended = () => {
                    audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
                };
              }

              // Text Handling
              const inputTr = msg.serverContent?.inputTranscription?.text;
              const outputTr = msg.serverContent?.outputTranscription?.text;
              
              if (inputTr) {
                setCurrentText(prev => ({ ...prev, user: prev.user + inputTr }));
              }
              if (outputTr) {
                setCurrentText(prev => ({ ...prev, model: prev.model + outputTr }));
              }

              // Commit to history on Turn Complete
              if (msg.serverContent?.turnComplete) {
                 setTranscripts(prev => {
                     // Optimistic update logic would go here if needed, 
                     // but for now we rely on the state snapshot in the timeout below
                     return prev;
                 });
                 
                setCurrentText(curr => {
                    if (curr.user.trim()) {
                         setTranscripts(t => [...t, {
                             id: Date.now() + 'u',
                             source: 'user',
                             text: curr.user,
                             timestamp: Date.now(),
                             isFinal: true
                         }]);
                    }
                    if (curr.model.trim()) {
                         setTranscripts(t => [...t, {
                             id: Date.now() + 'm',
                             source: 'model',
                             text: curr.model,
                             timestamp: Date.now(),
                             isFinal: true
                         }]);
                    }
                    return { user: '', model: '' };
                });
              }
            },
            onclose: () => { if (mounted) setIsConnected(false); },
            onerror: (e) => { console.error("Gemini Live Error", e); }
          }
        });
        
        sessionPromise.then(s => sessionRef.current = s);

      } catch (err) {
        console.error("Failed to initialize session", err);
      }
    };

    startSession();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      inputContextRef.current?.close();
      outputContextRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemInstruction, isMuted]); // Gain updates handled by separate effect

  const toggleMute = () => setIsMuted(!isMuted);

  const handleFinish = () => {
    // Save session
    if (transcripts.length > 0) {
        const session: SavedSession = {
            id: Date.now().toString(),
            date: Date.now(),
            speakers,
            transcript: transcripts
        };
        saveSession(session);
    }
    onEndSession();
  };

  const displayUser = currentText.user || transcripts.filter(t => t.source === 'user').slice(-1)[0]?.text || '';
  const displayModel = currentText.model || transcripts.filter(t => t.source === 'model').slice(-1)[0]?.text || '';

  const getTextSizeClass = () => {
      switch(textSize) {
          case 'normal': return 'text-2xl md:text-3xl lg:text-4xl';
          case 'huge': return 'text-6xl md:text-7xl lg:text-8xl';
          default: return 'text-4xl md:text-5xl lg:text-6xl';
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden relative font-sans">
        
        {/* Settings Panel Overlay */}
        {showSettings && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                <div className="w-full max-w-sm bg-slate-800 h-full shadow-2xl p-6 border-l border-slate-700 animate-slide-in-right">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold flex items-center space-x-2">
                            <Settings className="w-5 h-5 text-blue-500" />
                            <span>Session Settings</span>
                        </h2>
                        <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-700 rounded-full transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Audio Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Audio Output</h3>
                            <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Text-to-Speech</span>
                                    <button 
                                        onClick={() => setTtsEnabled(!ttsEnabled)}
                                        className={clsx(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            ttsEnabled ? "bg-blue-500" : "bg-slate-600"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                                            ttsEnabled ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                                <div className={clsx("transition-opacity space-y-2", !ttsEnabled && "opacity-50 pointer-events-none")}>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Volume</span>
                                        <span>{Math.round(ttsVolume * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.1"
                                        value={ttsVolume}
                                        onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <VolumeX className="w-4 h-4" />
                                        <Volume2 className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Display Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Display</h3>
                            <div className="bg-slate-700/50 rounded-xl p-4">
                                <div className="mb-3 font-medium flex items-center space-x-2">
                                    <Type className="w-4 h-4 text-slate-400" />
                                    <span>Text Size</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['normal', 'large', 'huge'] as const).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setTextSize(size)}
                                            className={clsx(
                                                "py-2 rounded-lg text-sm font-medium transition-all capitalize",
                                                textSize === size 
                                                    ? "bg-blue-600 text-white shadow-lg" 
                                                    : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                                            )}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                    <div className={clsx("w-3 h-3 rounded-full animate-pulse", isConnected ? "bg-red-500" : "bg-yellow-500")} />
                    <span className="text-sm font-bold text-slate-300">LIVE</span>
                </div>
                <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    title={ttsEnabled ? "Mute Text-to-Speech" : "Enable Text-to-Speech"}
                    className={clsx(
                        "flex items-center space-x-2 text-xs font-mono px-3 py-2 rounded-full border transition-all cursor-pointer select-none",
                        ttsEnabled 
                            ? "bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700 hover:border-slate-500" 
                            : "bg-slate-900/30 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-400"
                    )}
                >
                    <div className={clsx("w-2 h-2 rounded-full transition-all duration-300", ttsEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-slate-600")} />
                    <span className="font-bold tracking-wide">TTS {ttsEnabled ? 'ON' : 'OFF'}</span>
                </button>
            </div>

            <div className="flex items-center space-x-3">
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full border border-slate-600 transition-all shadow-lg backdrop-blur-sm"
                >
                    <Settings className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleFinish}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
                >
                    <Save className="w-4 h-4" />
                    <span>End</span>
                </button>
            </div>
        </div>

        {/* Karaoke Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
            
            {/* Original Speech Zone */}
            <div className="w-full max-w-5xl text-center space-y-4">
                <div className="text-slate-400 text-sm font-bold tracking-widest uppercase flex items-center justify-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Original Audio</span>
                </div>
                <div className={clsx(
                    "font-extrabold leading-tight transition-all duration-300",
                    getTextSizeClass(),
                    currentText.user ? "text-white scale-105" : "text-slate-500"
                )}>
                    {displayUser || "..."}
                </div>
            </div>

            <div className="w-24 h-1 bg-slate-800 rounded-full"></div>

            {/* Translation Zone */}
            <div className="w-full max-w-5xl text-center space-y-4">
                 <div className="text-blue-400 text-sm font-bold tracking-widest uppercase flex items-center justify-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Translation</span>
                </div>
                <div className={clsx(
                    "font-extrabold leading-tight text-blue-500 transition-all duration-300",
                    getTextSizeClass(),
                    currentText.model ? "opacity-100 scale-105" : "opacity-80"
                )}>
                    {displayModel || "..."}
                </div>
            </div>

        </div>

        {/* Bottom Bar */}
        <div className="p-8 pb-12 flex justify-center z-20">
             <button 
                onClick={toggleMute}
                className={clsx(
                    "p-6 rounded-full transition-all duration-200 shadow-2xl border-4",
                    isMuted 
                        ? "bg-slate-800 border-red-500 text-red-500 hover:bg-slate-700" 
                        : "bg-blue-600 border-blue-400 text-white hover:bg-blue-500 hover:scale-110"
                )}
            >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
        </div>

        {/* Audio Visualizer Background Effect */}
        <div 
            className="absolute bottom-0 left-0 right-0 h-64 bg-blue-600/10 blur-3xl transition-all duration-75 pointer-events-none"
            style={{ 
                opacity: Math.max(0.2, audioLevel / 50),
                transform: `scaleY(${1 + audioLevel / 30})` 
            }}
        />
    </div>
  );
};