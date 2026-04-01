import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getNextSortPair, checkCanUndo } from "@/lib/pairing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = await getSessionId();
  const albumSlug = request.nextUrl.searchParams.get("album") ?? "all";

  const result = await getNextSortPair(sessionId, albumSlug);

  if (!result) {
    // Even when complete, check if undo is available
    const canUndo = await checkCanUndo(sessionId, albumSlug || "all");
    return NextResponse.json(
      { error: "Ranking complete", canUndo },
      { status: 404 }
    );
  }

  return NextResponse.json({
    songA: result.songA,
    songB: result.songB,
    progress: result.progress,
    estimatedTotal: result.estimatedTotal,
    canUndo: result.canUndo,
  });
}
