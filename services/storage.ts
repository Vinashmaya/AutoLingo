import { SavedSession } from "../types";

const STORAGE_KEY = 'autolingo_sessions';

export const getSavedSessions = (): SavedSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: SavedSession) => {
  try {
    const sessions = getSavedSessions();
    // Add to beginning
    const newSessions = [session, ...sessions];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  } catch (e) {
    console.error("Failed to save session", e);
  }
};

export const deleteSession = (sessionId: string) => {
    try {
        const sessions = getSavedSessions();
        const newSessions = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
        console.error("Failed to delete session", e);
    }
}
