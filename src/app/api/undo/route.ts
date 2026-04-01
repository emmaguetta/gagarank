import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getDb } from "@/lib/db";
import { calculateNewElo } from "@/lib/elo";
import { MergeSortState, hasPreviousSnapshot, restoreSnapshot } from "@/lib/merge-sort";
import { saveState } from "@/lib/pairing";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  const body = await request.json();
  const { album } = body as { album?: string };
  const filterKey = album || "all";

  const db = getDb();

  // Load merge sort state
  const { data: stateRow } = await db
    .from("merge_sort_states")
    .select("state")
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey)
    .single();

  if (!stateRow) {
    return NextResponse.json({ error: "No state to undo" }, { status: 404 });
  }

  const state = stateRow.state as MergeSortState;

  if (!hasPreviousSnapshot(state)) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 400 });
  }

  // Find the most recent comparison for this session to reverse ELO
  const { data: lastComparison } = await db
    .from("comparisons")
    .select("id, winner_id, loser_id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastComparison) {
    const winnerId = lastComparison.winner_id;
    const loserId = lastComparison.loser_id;

    // Reverse ELO: recalculate as if the loser won, then apply the opposite delta
    const { data: songs } = await db
      .from("songs")
      .select("id, global_elo, global_comparison_count")
      .in("id", [winnerId, loserId]);

    if (songs && songs.length === 2) {
      const winner = songs.find((s) => s.id === winnerId)!;
      const loser = songs.find((s) => s.id === loserId)!;

      // Reverse: calculate what ELOs were before by doing the inverse operation
      // We know current ELOs are post-update. Use inverse calculation.
      const { newWinnerElo: reverseWinElo, newLoserElo: reverseLoseElo } =
        calculateNewElo(loser.global_elo, winner.global_elo);

      // The old winner ELO = current loser-side reverse, old loser ELO = current winner-side reverse
      await Promise.all([
        db.from("songs").update({
          global_elo: reverseLoseElo,
          global_comparison_count: Math.max(0, winner.global_comparison_count - 1),
        }).eq("id", winnerId),
        db.from("songs").update({
          global_elo: reverseWinElo,
          global_comparison_count: Math.max(0, loser.global_comparison_count - 1),
        }).eq("id", loserId),
      ]);
    }

    // Delete the comparison record
    await db.from("comparisons").delete().eq("id", lastComparison.id);

    // Decrement session comparison count
    const { data: session } = await db
      .from("sessions")
      .select("comparison_count")
      .eq("id", sessionId)
      .single();
    if (session && session.comparison_count > 0) {
      await db
        .from("sessions")
        .update({ comparison_count: session.comparison_count - 1 })
        .eq("id", sessionId);
    }
  }

  // Restore merge sort state
  const restoredState = restoreSnapshot(state);
  await saveState(sessionId, filterKey, restoredState);

  return NextResponse.json({ success: true });
}
