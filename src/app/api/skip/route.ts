import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { skipSongs } from "@/lib/pairing";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  const body = await request.json();
  const { songIds, album } = body as { songIds: number[]; album: string };

  if (!songIds || songIds.length === 0) {
    return NextResponse.json({ error: "songIds required" }, { status: 400 });
  }

  const filterKey = album || "all";
  await skipSongs(sessionId, filterKey, songIds);

  return NextResponse.json({ success: true });
}
