"use client";

import { SongWithAlbum } from "@/types";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: SongWithAlbum;
  onClick: () => void;
  isSelected?: boolean;
  isDimmed?: boolean;
}

export function SongCard({ song, onClick, isSelected, isDimmed }: SongCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-300 rounded-2xl border-2 px-5 py-4",
        "bg-white/5 backdrop-blur-md",
        "flex items-center gap-4",
        isSelected
          ? "border-gaga-pink glow-pink-strong scale-[1.01] bg-white/10"
          : "border-white/10 hover:border-gaga-purple/40 hover:bg-white/10 hover:scale-[1.01]",
        isDimmed && "opacity-40 scale-95"
      )}
    >
      {/* Album color indicator */}
      <div className="w-12 h-12 shrink-0 rounded-full bg-linear-to-br from-gaga-pink to-gaga-purple flex items-center justify-center">
        <span className="text-lg font-bold text-white font-merriweather">
          {song.title.charAt(0)}
        </span>
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-merriweather text-lg font-bold text-foreground leading-tight truncate">
          {song.title}
          {song.collaborator && (
            <span className="text-sm font-merriweather font-normal text-gaga-pink ml-2">
              feat. {song.collaborator}
            </span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {song.albumName}
        </p>
      </div>

      {/* Choose button */}
      <div className="shrink-0 px-5 py-2 rounded-full bg-gaga-pink/10 border border-gaga-pink/30 text-gaga-pink text-sm font-semibold transition-all duration-200 hover:bg-gaga-pink hover:text-white">
        Choose
      </div>
    </div>
  );
}
