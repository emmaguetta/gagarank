"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { albums } from "@/data/songs";
import { cn } from "@/lib/utils";
import { StoryGenerator } from "@/components/ranking/story-generator";

interface RankedSong {
  rank: number;
  id: number;
  title: string;
  albumName: string;
  albumSlug: string;
  collaborator: string | null;
  wins?: number;
  comparisons?: number;
  elo?: number;
  isBonusTrack: boolean;
}

interface RankingTableProps {
  scope: "user" | "global";
  initialFilter?: string;
  showFilter?: boolean;
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[10px] text-muted-foreground cursor-help"
      >
        i
      </button>
      {open && pos && (
        <span
          className="fixed w-56 p-4 rounded-2xl bg-gaga-card/90 backdrop-blur-md border border-white/10 text-xs text-foreground z-[9999] shadow-2xl leading-relaxed text-center whitespace-normal"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function RankingTable({ scope, initialFilter, showFilter = true }: RankingTableProps) {
  const [rankings, setRankings] = useState<RankedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumFilter, setAlbumFilter] = useState(initialFilter ?? "all");

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?scope=${scope}&album=${albumFilter}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setRankings(data.rankings);
        }
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      }
      setLoading(false);
    }
    fetchRankings();
  }, [scope, albumFilter]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-400 font-bold";
    if (rank === 2) return "text-gray-300 font-bold";
    if (rank === 3) return "text-amber-600 font-bold";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gaga-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      {showFilter && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Filter by album:</label>
          <select
            value={albumFilter}
            onChange={(e) => setAlbumFilter(e.target.value)}
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
      )}

      {rankings.length > 0 && (
        <div className="flex justify-end">
          <StoryGenerator scope={scope} albumFilter={albumFilter} rankings={rankings} />
        </div>
      )}

      {rankings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No ranking yet</p>
          <p className="text-sm mt-2">
            Start comparing songs to see your ranking appear!
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table className="w-full table-fixed sm:table-auto">
            <TableHeader>
              <TableRow className="bg-gaga-card/50 hover:bg-gaga-card/50">
                <TableHead className="w-10 sm:w-16 text-center">#</TableHead>
                <TableHead className="truncate">Title</TableHead>
                <TableHead className="hidden sm:table-cell">Album</TableHead>
                {scope === "global" ? (
                  <>
                    <TableHead className="hidden sm:table-cell text-center overflow-visible">
                      <span className="inline-flex items-center gap-1">
                        Compared
                        <InfoTooltip text="Total number of times this song has been compared by all users, wins and losses included." />
                      </span>
                    </TableHead>
                    <TableHead className="w-16 sm:w-auto text-center overflow-visible">
                      <span className="inline-flex items-center gap-1">
                        <span className="sm:hidden">ELO</span>
                        <span className="hidden sm:inline">ELO Score</span>
                        <InfoTooltip text="Rating based on the ELO system (like in chess). Winning against a higher-rated song gives more points. Starts at 1500." />
                      </span>
                    </TableHead>
                  </>
                ) : (
                  <TableHead className="w-14 sm:w-auto text-center">Wins</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((song) => (
                <TableRow
                  key={song.id}
                  className={cn(
                    "hover:bg-gaga-card/30 transition-colors",
                    song.rank <= 3 && "bg-gaga-card/20"
                  )}
                >
                  <TableCell className={cn("text-center text-lg", getRankStyle(song.rank))}>
                    {song.rank}
                  </TableCell>
                  <TableCell className="max-w-0 sm:max-w-none">
                    <div className="truncate">
                      <span className="font-medium">{song.title}</span>
                      {song.collaborator && (
                        <span className="text-xs text-gaga-pink ml-1 sm:ml-2">
                          ft. {song.collaborator}
                        </span>
                      )}
                    </div>
                    <span className="sm:hidden block text-xs text-muted-foreground truncate">
                      {song.albumName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {song.albumName}
                  </TableCell>
                  {scope === "global" ? (
                    <>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            (song.comparisons ?? 0) > 0
                              ? "bg-gaga-purple/20 text-gaga-purple border-gaga-purple/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {song.comparisons ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-xs bg-gaga-pink/20 text-gaga-pink border-gaga-pink/30"
                        >
                          {song.elo ?? 1500}
                        </Badge>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          (song.wins ?? 0) > 0
                            ? "bg-gaga-pink/20 text-gaga-pink border-gaga-pink/30"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {song.wins ?? 0}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
