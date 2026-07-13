const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const CALENDAR_ID = "primary";
const STORAGE_KEY = "google_calendar_token";
const EXPIRY_KEY = "google_calendar_expires_at";

export type GoogleEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function redirectToGoogleAuth(clientId: string): void {
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
    state: "calendar",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function handleRedirectCallback(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token")) return false;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get("access_token");
  const expiresIn = parseInt(params.get("expires_in") || "3600");

  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  if (token) {
    sessionStorage.setItem(STORAGE_KEY, token);
    sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    return true;
  }
  return false;
}

export function getToken(): Promise<string> {
  const token = sessionStorage.getItem(STORAGE_KEY);
  const expiresAt = sessionStorage.getItem(EXPIRY_KEY);
  if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
    return Promise.resolve(token);
  }
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
  return Promise.reject(new Error("Token expirado. Conectá Google Calendar de nuevo."));
}

export function disconnectGoogleCalendar(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}

export async function listEvents(token: string, timeMin: string, timeMax: string): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al obtener eventos");
  const data = await res.json();
  return data.items || [];
}

export async function createEvent(token: string, event: {
  summary: string;
  description?: string;
  start: string;
  end: string;
}): Promise<GoogleEvent> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description || "",
      start: { dateTime: event.start },
      end: { dateTime: event.end },
    }),
  });
  if (!res.ok) throw new Error("Error al crear evento");
  return res.json();
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error al eliminar evento");
}
