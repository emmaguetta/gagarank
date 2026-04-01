import { getDb } from "./db";
import { SongWithAlbum } from "@/types";
import { nonPopAlbumSlugs, hitSongTitles } from "@/data/songs";
import {
  MergeSortState,
  initMergeSort,
  getNextPair,
  recordChoice,
  removeSongs,
  isComplete,
  estimateTotal,
  hasPreviousSnapshot,
} from "./merge-sort";

type AlbumRef = { name: string; slug: string };

/** Fetch all eligible songs for a given filter */
export async function getFilteredSongs(
  albumSlug?: string
): Promise<SongWithAlbum[]> {
  const db = getDb();
  let songsQuery = db
    .from("songs")
    .select(
      "id, title, album_id, track_number, is_bonus_track, collaborator, albums!inner(name, slug)"
    );

  if (albumSlug === "hits") {
    songsQuery = songsQuery.in("title", hitSongTitles);
  } else if (albumSlug === "pop") {
    for (const slug of nonPopAlbumSlugs) {
      songsQuery = songsQuery.neq("albums.slug", slug);
    }
  } else if (albumSlug && albumSlug !== "all") {
    songsQuery = songsQuery.eq("albums.slug", albumSlug);
  }

  const { data: songsData } = await songsQuery;

  if (!songsData) return [];

  return songsData.map((row) => {
    const album = row.albums as unknown as AlbumRef;
    return {
      id: Number(row.id),
      title: row.title,
      albumId: Number(row.album_id),
      trackNumber: row.track_number,
      isBonusTrack: row.is_bonus_track,
      collaborator: row.collaborator,
      albumName: album.name,
      albumSlug: album.slug,
    };
  });
}

/** Load or create merge sort state for a session + filter */
async function loadOrCreateState(
  sessionId: string,
  filterKey: string,
  songs: SongWithAlbum[]
): Promise<MergeSortState> {
  const db = getDb();

  const { data } = await db
    .from("merge_sort_states")
    .select("state")
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey)
    .single();

  if (data) {
    return data.state as MergeSortState;
  }

  // No state yet — initialize
  const songIds = songs.map((s) => s.id);
  const state = initMergeSort(songIds);

  await db.from("merge_sort_states").insert({
    session_id: sessionId,
    filter_key: filterKey,
    state: state as unknown as Record<string, unknown>,
  });

  return state;
}

/** Save merge sort state */
export async function saveState(
  sessionId: string,
  filterKey: string,
  state: MergeSortState
): Promise<void> {
  const db = getDb();
  await db
    .from("merge_sort_states")
    .update({
      state: state as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey);
}

/** Delete merge sort state (for reset) */
export async function deleteState(
  sessionId: string,
  filterKey: string
): Promise<void> {
  const db = getDb();
  if (filterKey === "all") {
    await db
      .from("merge_sort_states")
      .delete()
      .eq("session_id", sessionId);
  } else {
    await db
      .from("merge_sort_states")
      .delete()
      .eq("session_id", sessionId)
      .eq("filter_key", filterKey);
  }
}

export interface PairResult {
  songA: SongWithAlbum;
  songB: SongWithAlbum;
  progress: number;
  estimatedTotal: number;
  canUndo: boolean;
}

/** Get the next pair to compare using merge sort */
export async function getNextSortPair(
  sessionId: string,
  albumSlug?: string
): Promise<PairResult | null> {
  const filterKey = albumSlug || "all";
  const songs = await getFilteredSongs(albumSlug);

  if (songs.length < 2) return null;

  const state = await loadOrCreateState(sessionId, filterKey, songs);

  if (isComplete(state)) return null;

  const pair = getNextPair(state);
  if (!pair) return null;

  const songA = songs.find((s) => s.id === pair.songAId);
  const songB = songs.find((s) => s.id === pair.songBId);

  if (!songA || !songB) return null;

  return {
    songA,
    songB,
    progress: state.comparisonsDone,
    estimatedTotal: estimateTotal(state.totalSongs),
    canUndo: hasPreviousSnapshot(state),
  };
}

/** Advance merge sort after a comparison */
export async function advanceSort(
  sessionId: string,
  filterKey: string,
  winnerId: number
): Promise<void> {
  const db = getDb();

  const { data } = await db
    .from("merge_sort_states")
    .select("state")
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey)
    .single();

  if (!data) return;

  const state = data.state as MergeSortState;
  const newState = recordChoice(state, winnerId);
  await saveState(sessionId, filterKey, newState);
}

/** Check if undo is available for a given session + filter */
export async function checkCanUndo(
  sessionId: string,
  filterKey: string
): Promise<boolean> {
  const db = getDb();
  const { data } = await db
    .from("merge_sort_states")
    .select("state")
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey)
    .single();

  if (!data) return false;
  return hasPreviousSnapshot(data.state as MergeSortState);
}

/** Skip songs (remove from sort) */
export async function skipSongs(
  sessionId: string,
  filterKey: string,
  songIds: number[]
): Promise<void> {
  const db = getDb();

  const { data } = await db
    .from("merge_sort_states")
    .select("state")
    .eq("session_id", sessionId)
    .eq("filter_key", filterKey)
    .single();

  if (!data) return;

  const state = data.state as MergeSortState;
  const newState = removeSongs(state, songIds);
  await saveState(sessionId, filterKey, newState);
}
