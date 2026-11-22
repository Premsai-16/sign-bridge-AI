import { accountStorage } from './account'
export interface SavedSession {
  id: string
  content: string
  language: string
  createdAt: string
}

const KEY = 'signbridge-sessions'

export function getSavedSessions(): SavedSession[] {
  try {
    const value: unknown = JSON.parse(accountStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value as SavedSession[] : []
  } catch {
    return []
  }
}

export function saveSession(content: string, language = 'ISL → English'): SavedSession {
  const session: SavedSession = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, content, language, createdAt: new Date().toISOString() }
  accountStorage.setItem(KEY, JSON.stringify([session, ...getSavedSessions()]))
  return session
}

export function removeSession(id: string): void {
  accountStorage.setItem(KEY, JSON.stringify(getSavedSessions().filter(session => session.id !== id)))
}

export function clearSessions(): void {
  accountStorage.removeItem(KEY)
}
