import React, { useState } from 'react';
import { SetupStep } from './components/SetupStep';
import { LiveTranslator } from './components/LiveTranslator';
import { HistoryView } from './components/HistoryView';
import { INITIAL_SPEAKERS } from './constants';
import { AppStep, Speaker } from './types';
import { CarFront } from 'lucide-react';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.SETUP);
  const [speakers, setSpeakers] = useState<[Speaker, Speaker]>([
    { ...INITIAL_SPEAKERS[0], name: 'Agent' },
    { ...INITIAL_SPEAKERS[1], name: 'Customer' }
  ]);

  const handleSetupComplete = () => {
    setStep(AppStep.LIVE);
  };

  const handleEndSession = () => {
      setStep(AppStep.SETUP);
      setSpeakers([
        { ...INITIAL_SPEAKERS[0], name: 'Agent' },
        { ...INITIAL_SPEAKERS[1], name: 'Customer' }
      ]);
  };

  const handleViewHistory = () => {
      setStep(AppStep.HISTORY);
  };

  const handleBackFromHistory = () => {
      setStep(AppStep.SETUP);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white">
      {step !== AppStep.LIVE && step !== AppStep.HISTORY && (
        <header className="pt-12 pb-8 text-center">
           <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-4 border border-blue-500/20">
              <CarFront className="w-10 h-10 text-blue-500" />
           </div>
           <h1 className="text-4xl font-extrabold tracking-tight mb-2">
             AutoLingo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Live</span>
           </h1>
           <p className="text-slate-400 max-w-sm mx-auto">
             Dealership Sales Translator
           </p>
        </header>
      )}

      <main className={step === AppStep.LIVE || step === AppStep.HISTORY ? "h-screen" : "container mx-auto px-4"}>
        {step === AppStep.SETUP && (
          <SetupStep 
            speakers={speakers} 
            setSpeakers={setSpeakers} 
            onNext={handleSetupComplete}
            onViewHistory={handleViewHistory}
          />
        )}

        {step === AppStep.LIVE && (
          <LiveTranslator 
            speakers={speakers} 
            onEndSession={handleEndSession} 
          />
        )}

        {step === AppStep.HISTORY && (
            <HistoryView onBack={handleBackFromHistory} />
        )}
      </main>
      
      {step !== AppStep.LIVE && step !== AppStep.HISTORY && (
         <footer className="mt-12 text-center text-slate-600 text-sm pb-8">
            <p>Powered by Gemini 2.5 Native Audio API</p>
         </footer>
      )}
    </div>
  );
}

export default App;
