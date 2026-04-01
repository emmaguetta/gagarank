import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { albums } from "@/data/songs";

export async function POST() {
  const db = getDb();

  for (const album of albums) {
    // Upsert album
    const { data: albumData, error: albumError } = await db
      .from("albums")
      .upsert({ name: album.name, slug: album.slug, release_year: album.releaseYear }, { onConflict: "slug" })
      .select("id")
      .single();

    if (albumError || !albumData) {
      return NextResponse.json({ error: `Album error: ${albumError?.message}` }, { status: 500 });
    }

    // Upsert songs
    const songsToInsert = album.tracks.map((track) => ({
      title: track.title,
      album_id: albumData.id,
      track_number: track.trackNumber,
      is_bonus_track: track.isBonus ?? false,
      collaborator: track.collaborator ?? null,
    }));

    const { error: songsError } = await db.from("songs").upsert(songsToInsert, {
      onConflict: "album_id,track_number",
    });

    if (songsError) {
      return NextResponse.json({ error: `Songs error: ${songsError.message}` }, { status: 500 });
    }
  }

  const { count: songCount } = await db.from("songs").select("*", { count: "exact", head: true });
  const { count: albumCount } = await db.from("albums").select("*", { count: "exact", head: true });

  return NextResponse.json({
    success: true,
    albums: albumCount,
    songs: songCount,
  });
}
