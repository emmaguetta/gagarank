import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./db";

const SESSION_COOKIE = "gaga-session-id";

export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE);

  if (existing?.value) {
    return existing.value;
  }

  const newId = uuidv4();
  cookieStore.set(SESSION_COOKIE, newId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return newId;
}

export async function ensureSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.from("sessions").upsert({ id: sessionId }, { onConflict: "id" });
}
