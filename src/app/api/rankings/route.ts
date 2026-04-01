import { NextRequest, NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getDb } from "@/lib/db";
import { nonPopAlbumSlugs, hitSongTitles } from "@/data/songs";

export const dynamic = "force-dynamic";

// Count transitive wins: for each song, BFS to find all reachable (beaten) songs
function countTransitiveWins(
  wins: Map<number, Set<number>>
): Map<number, number> {
  const result = new Map<number, number>();

  for (const songId of wins.keys()) {
    const beaten = new Set<number>();
    const stack = [...(wins.get(songId) ?? [])];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (beaten.has(current)) continue;
      beaten.add(current);
      for (const next of wins.get(current) ?? []) {
        if (!beaten.has(next)) stack.push(next);
      }
    }

    result.set(songId, beaten.size);
  }

  return result;
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") ?? "user";
  const albumSlug = request.nextUrl.searchParams.get("album") ?? "all";

  const db = getDb();

  // Get all songs (optionally filtered by album)
  let songsQuery = db
    .from("songs")
    .select("id, title, album_id, track_number, is_bonus_track, collaborator, global_elo, global_comparison_count, albums!inner(name, slug)");

  if (albumSlug === "hits") {
    songsQuery = songsQuery.in("title", hitSongTitles);
  } else if (albumSlug === "pop") {
    for (const slug of nonPopAlbumSlugs) {
      songsQuery = songsQuery.neq("albums.slug", slug);
    }
  } else if (albumSlug && albumSlug !== "all") {
    songsQuery = songsQuery.eq("albums.slug", albumSlug);
  }

  const { data: songsData, error: songsError } = await songsQuery;

  if (songsError || !songsData) {
    return NextResponse.json({ error: songsError?.message }, { status: 500 });
  }

  type AlbumRef = { name: string; slug: string };
  const songs = songsData;

  if (scope === "global") {
    // Global ranking: sort by ELO, display comparison count
    const ranked = songs
      .map((row) => {
        const album = row.albums as unknown as AlbumRef;
        return {
          id: row.id,
          title: row.title,
          albumId: row.album_id,
          isBonusTrack: row.is_bonus_track,
          collaborator: row.collaborator,
          albumName: album.name,
          albumSlug: album.slug,
          comparisons: row.global_comparison_count ?? 0,
          _elo: row.global_elo as number,
          rank: 0,
        };
      })
      .sort((a, b) => b._elo - a._elo)
      .map((song, index) => ({ ...song, rank: index + 1 }));

    const rankings = ranked.map(({ _elo, ...rest }) => ({ ...rest, elo: Math.round(_elo) }));
    return NextResponse.json({ rankings });
  }

  // User ranking: transitive wins
  const sessionId = await getSessionId();
  const { data: compsData } = await db
    .from("comparisons")
    .select("winner_id, loser_id")
    .eq("session_id", sessionId);

  const comparisons = compsData ?? [];
  const songIds = new Set(songs.map((s) => Number(s.id)));

  const wins = new Map<number, Set<number>>();
  for (const songId of songIds) {
    wins.set(songId, new Set());
  }

  for (const row of comparisons) {
    const w = Number(row.winner_id);
    const l = Number(row.loser_id);
    if (!songIds.has(w) || !songIds.has(l)) continue;
    wins.get(w)!.add(l);
  }

  const transitiveWins = countTransitiveWins(wins);

  const rankings = songs
    .map((row) => {
      const album = row.albums as unknown as AlbumRef;
      return {
        id: row.id,
        title: row.title,
        albumId: row.album_id,
        isBonusTrack: row.is_bonus_track,
        collaborator: row.collaborator,
        albumName: album.name,
        albumSlug: album.slug,
        wins: transitiveWins.get(Number(row.id)) ?? 0,
        rank: 0,
      };
    })
    .sort((a, b) => b.wins - a.wins)
    .map((song, index) => ({ ...song, rank: index + 1 }));

  return NextResponse.json({ rankings });
}
