"use client";

import { useState, useEffect, useCallback } from "react";
import { SongCard } from "@/components/compare/song-card";
import { SongWithAlbum } from "@/types";
import { albums } from "@/data/songs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComparisonViewProps {
  albumFilter?: string;
}

interface RankedSong {
  id: number;
  rank: number;
  title: string;
  albumName: string;
  collaborator: string | null;
  wins: number;
}

export function ComparisonView({ albumFilter = "all" }: ComparisonViewProps) {
  const [songA, setSongA] = useState<SongWithAlbum | null>(null);
  const [songB, setSongB] = useState<SongWithAlbum | null>(null);
  const [selected, setSelected] = useState<"a" | "b" | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonCount, setComparisonCount] = useState(0);
  const [currentFilter, setCurrentFilter] = useState(albumFilter);
  const [rankings, setRankings] = useState<RankedSong[]>([]);
  const [rankingComplete, setRankingComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const fetchPair = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/pair?album=${currentFilter}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSongA(data.songA);
        setSongB(data.songB);
        setProgress(data.progress);
        setEstimatedTotal(data.estimatedTotal);
        setCanUndo(data.canUndo ?? false);
        setRankingComplete(false);
      } else if (res.status === 404) {
        const data = await res.json();
        setSongA(null);
        setSongB(null);
        setCanUndo(data.canUndo ?? false);
        setRankingComplete(true);
      }
    } catch (error) {
      console.error("Failed to fetch pair:", error);
    }
    setLoading(false);
  }, [currentFilter]);

  const fetchRankings = useCallback(async () => {
    try {
      const res = await fetch(`/api/rankings?scope=user&album=${currentFilter}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setRankings(data.rankings);
      }
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
    }
  }, [currentFilter]);

  useEffect(() => {
    fetchPair();
    fetchRankings();
  }, [fetchPair, fetchRankings]);

  const handleChoice = async (winner: "a" | "b") => {
    if (selected || !songA || !songB) return;

    setSelected(winner);

    const winnerSong = winner === "a" ? songA : songB;
    const loserSong = winner === "a" ? songB : songA;

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: winnerSong.id,
          loserId: loserSong.id,
          album: currentFilter,
        }),
      });

      if (res.ok) {
        setComparisonCount((c) => c + 1);
        fetchRankings();
      }
    } catch (error) {
      console.error("Failed to record comparison:", error);
    }

    // Fetch next pair after animation
    setTimeout(() => {
      fetchPair();
    }, 600);
  };

  const handleSkip = async () => {
    if (!songA || !songB) return;

    // Remove both songs from the merge sort
    await fetch("/api/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songIds: [songA.id, songB.id],
        album: currentFilter,
      }),
    });

    fetchPair();
  };

  const handleUndo = async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      const res = await fetch("/api/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ album: currentFilter }),
      });
      if (res.ok) {
        setComparisonCount((c) => Math.max(0, c - 1));
        await Promise.all([fetchPair(), fetchRankings()]);
      }
    } catch (error) {
      console.error("Failed to undo:", error);
    }
    setUndoing(false);
  };

  // Only show songs that have at least 1 win
  const rankedSongs = rankings.filter((s) => s.wins > 0);

  if (loading && !songA) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gaga-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPercent = estimatedTotal > 0 ? Math.min(100, Math.round((progress / estimatedTotal) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-[5%] items-start">
      {/* Left column — comparison */}
      <div className="space-y-8">
        {/* Title + filter row */}
        <div className="flex flex-col gap-16">
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold">
            Which song do you <span className="text-gaga-pink">prefer</span>?
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Album:</label>
              <select
                value={currentFilter}
                onChange={(e) => {
                  setCurrentFilter(e.target.value);
                }}
                className="appearance-none bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 pr-8 text-sm text-foreground transition-all duration-200 hover:border-gaga-pink/40 hover:bg-white/10 focus:border-gaga-pink/60 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-gaga-pink/30 cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FF1493' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="all">All Albums</option>
                <option value="pop">Only Pop Albums</option>
                <option value="hits">Only Singles</option>
                {albums.map((album) => (
                  <option key={album.slug} value={album.slug}>
                    {album.name} ({album.releaseYear})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Comparisons: <span className="text-gaga-pink font-semibold">{comparisonCount}</span>
              </span>
              <button
                onClick={async () => {
                  const albumName = currentFilter === "all"
                    ? null
                    : currentFilter === "pop"
                    ? "Only Pop Albums"
                    : currentFilter === "hits"
                    ? "Only Singles"
                    : albums.find((a) => a.slug === currentFilter)?.name;
                  const msg = albumName
                    ? `Clear your rankings for "${albumName}"? This cannot be undone.`
                    : "Clear ALL your rankings across every album? This cannot be undone.";
                  if (!confirm(msg)) return;
                  await fetch("/api/reset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ album: currentFilter }),
                  });
                  setComparisonCount(0);
                  setRankings([]);
                  setRankingComplete(false);
                  fetchPair();
                }}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* VS display or ranking complete */}
        {rankingComplete ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <span className="font-merriweather text-2xl font-bold text-gaga-pink">Ranking Complete!</span>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You&apos;ve compared enough songs to determine a full ranking. Check your results!
            </p>
            {canUndo && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="text-sm text-gaga-purple hover:text-gaga-pink transition-colors cursor-pointer disabled:opacity-50"
              >
                {undoing ? "Undoing..." : "← Undo last choice"}
              </button>
            )}
          </div>
        ) : songA && songB ? (
          <div className="space-y-4">
            <SongCard
              song={songA}
              onClick={() => handleChoice("a")}
              isSelected={selected === "a"}
              isDimmed={selected === "b"}
            />

            <div className="flex items-center justify-center">
              <span className="font-merriweather text-2xl font-bold text-gaga-purple">VS</span>
            </div>

            <SongCard
              song={songB}
              onClick={() => handleChoice("b")}
              isSelected={selected === "b"}
              isDimmed={selected === "a"}
            />

            {/* Skip & Undo buttons */}
            <div className="flex justify-center items-center gap-4 pt-1">
              {canUndo && (
                <button
                  onClick={handleUndo}
                  disabled={undoing}
                  className="text-sm text-gaga-purple hover:text-gaga-pink transition-colors cursor-pointer disabled:opacity-50"
                >
                  {undoing ? "Undoing..." : "← Undo last choice"}
                </button>
              )}
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Skip (I don&apos;t know one of these songs)
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Right column — live ranking sidebar */}
      <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto space-y-3 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-4">
        <h2 className="font-merriweather text-lg font-bold">
          Your Ranking <span className="text-xs font-merriweather font-normal text-muted-foreground ml-1.5">live</span>
        </h2>
        {rankedSongs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            Start comparing to see your ranking build up here!
          </p>
        ) : (
          <div className="space-y-1">
            {rankedSongs.map((song, index) => (
              <div
                key={song.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  index < 3 ? "bg-white/10" : "bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "w-6 text-center text-xs font-bold shrink-0",
                    index === 0 && "text-yellow-400",
                    index === 1 && "text-gray-300",
                    index === 2 && "text-amber-600",
                    index > 2 && "text-muted-foreground"
                  )}
                >
                  {song.rank}
                </span>
                <span className="flex-1 text-sm font-medium truncate">
                  {song.title}
                  {song.collaborator && (
                    <span className="text-xs text-gaga-pink ml-1">ft. {song.collaborator}</span>
                  )}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs bg-gaga-pink/20 text-gaga-pink border-gaga-pink/30 shrink-0"
                >
                  {song.wins}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
