import React from 'react';
import { Speaker, LANGUAGES } from '../types';
import { User, Languages, ArrowRight, History, Briefcase, Smile } from 'lucide-react';

interface SetupStepProps {
  speakers: [Speaker, Speaker];
  setSpeakers: React.Dispatch<React.SetStateAction<[Speaker, Speaker]>>;
  onNext: () => void;
  onViewHistory: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({ speakers, setSpeakers, onNext, onViewHistory }) => {
  const updateSpeaker = (index: 0 | 1, field: keyof Speaker, value: string) => {
    const newSpeakers = [...speakers] as [Speaker, Speaker];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setSpeakers(newSpeakers);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
      <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Session Setup</h2>
            <p className="text-slate-400">Select the languages for the Agent and the Customer.</p>
          </div>
          <button 
            onClick={onViewHistory}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center text-xs"
          >
             <History className="w-6 h-6 mb-1" />
             <span>History</span>
          </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Speaker 1 - Agent */}
        <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase className="w-24 h-24 text-blue-500" />
          </div>
          <div className="flex items-center space-x-2 text-blue-400 mb-2 relative z-10">
            <Briefcase className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Agent (You)</h3>
          </div>
          <div className="relative z-10">
            <label className="block text-sm text-slate-400 mb-2">Language</label>
            <div className="relative">
              <select
                value={speakers[0].language}
                onChange={(e) => updateSpeaker(0, 'language', e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-4 pr-10 py-3 text-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.label}>{lang.label}</option>
                ))}
              </select>
              <Languages className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Speaker 2 - Customer */}
        <div className="space-y-4 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-green-500/30 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Smile className="w-24 h-24 text-green-500" />
          </div>
          <div className="flex items-center space-x-2 text-green-400 mb-2 relative z-10">
            <Smile className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Customer</h3>
          </div>
          <div className="relative z-10">
            <label className="block text-sm text-slate-400 mb-2">Language</label>
            <div className="relative">
              <select
                value={speakers[1].language}
                onChange={(e) => updateSpeaker(1, 'language', e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-4 pr-10 py-3 text-white appearance-none focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.label}>{lang.label}</option>
                ))}
              </select>
              <Languages className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20"
        >
          <span>Start Live Session</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
