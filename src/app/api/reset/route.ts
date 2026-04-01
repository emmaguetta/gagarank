import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getDb } from "@/lib/db";
import { nonPopAlbumSlugs, hitSongTitles } from "@/data/songs";
import { deleteState } from "@/lib/pairing";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  const db = getDb();
  const body = await request.json();
  const albumSlug = body.album as string | undefined;

  if (albumSlug && albumSlug !== "all") {
    // Get song IDs for this album (or pop albums)
    let songsQuery = db
      .from("songs")
      .select("id, albums!inner(slug)");

    if (albumSlug === "hits") {
      songsQuery = songsQuery.in("title", hitSongTitles);
    } else if (albumSlug === "pop") {
      for (const slug of nonPopAlbumSlugs) {
        songsQuery = songsQuery.neq("albums.slug", slug);
      }
    } else {
      songsQuery = songsQuery.eq("albums.slug", albumSlug);
    }

    const { data: songs } = await songsQuery;

    if (songs && songs.length > 0) {
      const songIds = songs.map((s) => Number(s.id));

      // Delete comparisons where BOTH winner and loser are in this album
      const { error } = await db
        .from("comparisons")
        .delete()
        .eq("session_id", sessionId)
        .in("winner_id", songIds)
        .in("loser_id", songIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  } else {
    // Delete all comparisons for this session
    const { error } = await db
      .from("comparisons")
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reset session comparison count
    await db
      .from("sessions")
      .update({ comparison_count: 0 })
      .eq("id", sessionId);
  }

  // Delete merge sort state
  const filterKey = albumSlug || "all";
  await deleteState(sessionId, filterKey);

  return NextResponse.json({ success: true });
}
