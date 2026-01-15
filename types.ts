export interface Speaker {
  id: string;
  name: string;
  language: 'English' | 'Spanish';
  voiceId?: string; // Placeholder for future voice ID features
}

export interface TranscriptItem {
  id: string;
  source: 'user' | 'model';
  text: string;
  timestamp: number;
  isFinal: boolean;
  speakerName?: string; // Inferred speaker
}

export interface SavedSession {
  id: string;
  date: number;
  speakers: [Speaker, Speaker];
  transcript: TranscriptItem[];
}

export enum AppStep {
  SETUP = 'SETUP',
  LIVE = 'LIVE',
  HISTORY = 'HISTORY',
}

export const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'es-ES', label: 'Spanish' },
] as const;
