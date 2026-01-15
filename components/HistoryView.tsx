import React, { useEffect, useState } from 'react';
import { SavedSession } from '../types';
import { getSavedSessions, deleteSession } from '../services/storage';
import { ArrowLeft, Trash2, Calendar, User, MessageSquare } from 'lucide-react';

interface HistoryViewProps {
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    setSessions(getSavedSessions());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this record?')) {
        deleteSession(id);
        setSessions(prev => prev.filter(s => s.id !== id));
        if (selectedSession?.id === id) setSelectedSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button 
            onClick={selectedSession ? () => setSelectedSession(null) : onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">
            {selectedSession ? 'Transcript Review' : 'Sales History'}
          </h1>
        </div>

        {!selectedSession ? (
          <div className="grid gap-4">
            {sessions.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    <p>No saved conversations found.</p>
                </div>
            )}
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all group relative"
              >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center text-slate-400 text-sm mb-2">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(session.date).toLocaleString()}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="font-medium">{session.speakers[0].name} ({session.speakers[0].language})</span>
                            </div>
                            <span className="text-slate-600">vs</span>
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="font-medium">{session.speakers[1].name} ({session.speakers[1].language})</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center text-slate-500">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        <span className="text-sm">{session.transcript.length} turns</span>
                    </div>
                </div>
                <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="space-y-6">
                {selectedSession.transcript.map(item => (
                    <div key={item.id} className={`flex flex-col ${item.source === 'user' ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                            item.source === 'user' 
                            ? 'bg-slate-700/50 rounded-tl-none' 
                            : 'bg-blue-900/30 border border-blue-500/30 rounded-tr-none'
                        }`}>
                            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-bold">
                                {item.source === 'user' ? 'Original' : 'Translation'}
                            </div>
                            <p className="text-lg leading-relaxed">{item.text}</p>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 px-2">
                            {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
