import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { Mic, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface CalibrationStepProps {
  speakers: [Speaker, Speaker];
  onNext: () => void;
}

export const CalibrationStep: React.FC<CalibrationStepProps> = ({ speakers, onNext }) => {
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState<0 | 1>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState([false, false]);

  const currentSpeaker = speakers[currentSpeakerIndex];

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleComplete();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleComplete = () => {
    setIsRecording(false);
    const newCompleted = [...completed];
    newCompleted[currentSpeakerIndex] = true;
    setCompleted(newCompleted);
    
    if (currentSpeakerIndex === 0) {
      setTimeout(() => setCurrentSpeakerIndex(1), 1000);
    }
  };

  const allCompleted = completed[0] && completed[1];

  return (
    <div className="max-w-xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Voice Identification</h2>
      <p className="text-slate-400 mb-8">
        We need to identify who is speaking to provide accurate attribution.
      </p>

      {!allCompleted ? (
        <div className="space-y-8">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center bg-slate-900 rounded-full border-4 border-slate-700">
             {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-25"></div>
             )}
             <Mic className={`w-12 h-12 ${isRecording ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium text-white">
              {currentSpeaker.name}
            </h3>
            <p className="text-slate-400 text-sm">
              Please tap the mic and say: <br />
              <span className="text-white italic font-medium">
                "Hello, my name is {currentSpeaker.name} and I speak {currentSpeaker.language}."
              </span>
            </p>
          </div>

          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`
              w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
              ${isRecording 
                ? 'bg-slate-700 text-slate-300 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}
            `}
          >
            {isRecording ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Identify Voice</span>
              </>
            )}
          </button>
          
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
             <div 
               className="bg-blue-500 h-full transition-all duration-100 ease-linear"
               style={{ width: `${progress}%` }}
             ></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Ready to Translate</h3>
            <p className="text-slate-400">
              Both voices have been identified. You can now start the live translation session.
            </p>
          </div>
          
          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-green-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <span>Start Live Session</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};