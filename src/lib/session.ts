export const SESSION_STORAGE_KEY = "naqashcorner.session";

export type StoreUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  photoUrl: string;
  role: "customer" | "admin";
};
export type StoredSession = {
  token: string;
  user: StoreUser;
  expiresAt: string;
};

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as StoredSession;
    return session.token && Date.parse(session.expiresAt) > Date.now()
      ? session
      : null;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
