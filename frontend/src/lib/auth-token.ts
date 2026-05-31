/**
 * In-memory JWT cache synced with localStorage.
 */
export function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

let authToken: string | null = readStoredToken();

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  authToken = readStoredToken();
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}

/** Returns true when JWT exp claim is in the past (or token is malformed). */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function clearStoredSession(): void {
  clearAuthToken();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
