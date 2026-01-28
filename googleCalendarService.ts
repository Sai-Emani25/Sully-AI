import { CalendarEvent } from './types';

const SCOPE_KEY = 'sully_google_calendar_scope';

const EVENTS_KEY_PREFIX = 'sully_calendar_events_';

export function isCalendarConnected(): boolean {
  return localStorage.getItem(SCOPE_KEY) === 'granted';
}

export async function requestCalendarAccess(): Promise<boolean> {
  // Demo-only: in a real app, this would redirect to Google OAuth
  // and request https://www.googleapis.com/auth/calendar.events scope.
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.setItem(SCOPE_KEY, 'granted');
  return true;
}

export function getCalendarEvents(projectId: string): CalendarEvent[] {
  const key = EVENTS_KEY_PREFIX + projectId;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved) as CalendarEvent[];
  return [];
}

export function saveCalendarEvents(projectId: string, events: CalendarEvent[]): void {
  const key = EVENTS_KEY_PREFIX + projectId;
  localStorage.setItem(key, JSON.stringify(events));
}

export function addCalendarEvent(projectId: string, event: CalendarEvent): CalendarEvent[] {
  const existing = getCalendarEvents(projectId);
  const next = [event, ...existing];
  saveCalendarEvents(projectId, next);
  return next;
}
