import { NextRequest, NextResponse } from "next/server";
import { getSessionId, ensureSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { calculateNewElo } from "@/lib/elo";
import { advanceSort } from "@/lib/pairing";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  const body = await request.json();
  const { winnerId, loserId, album } = body as {
    winnerId: number;
    loserId: number;
    album?: string;
  };

  if (!winnerId || !loserId) {
    return NextResponse.json({ error: "winnerId and loserId required" }, { status: 400 });
  }

  const db = getDb();
  await ensureSession(sessionId);

  // Record the comparison
  const { error } = await db.from("comparisons").insert({
    session_id: sessionId,
    winner_id: winnerId,
    loser_id: loserId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update global ELO
  const { data: songs } = await db
    .from("songs")
    .select("id, global_elo, global_comparison_count")
    .in("id", [winnerId, loserId]);

  if (songs && songs.length === 2) {
    const winner = songs.find((s) => s.id === winnerId)!;
    const loser = songs.find((s) => s.id === loserId)!;
    const { newWinnerElo, newLoserElo } = calculateNewElo(winner.global_elo, loser.global_elo);

    await Promise.all([
      db.from("songs").update({ global_elo: newWinnerElo, global_comparison_count: winner.global_comparison_count + 1 }).eq("id", winnerId),
      db.from("songs").update({ global_elo: newLoserElo, global_comparison_count: loser.global_comparison_count + 1 }).eq("id", loserId),
    ]);
  }

  // Update session comparison count
  await db.rpc("increment_session_count", { sid: sessionId });

  // Advance merge sort state
  const filterKey = album || "all";
  await advanceSort(sessionId, filterKey, winnerId);

  return NextResponse.json({ success: true });
}
