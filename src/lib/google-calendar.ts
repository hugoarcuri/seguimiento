const SCOPES = "https://www.googleapis.com/auth/calendar.events";
const CALENDAR_ID = "primary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenClient: any = null;
let gisLoaded = false;

export type GoogleEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

function loadGis(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export async function initGoogleCalendar(clientId: string) {
  await loadGis();
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  });
}

export function getToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google Calendar no inicializado"));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: "" });
  });
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
