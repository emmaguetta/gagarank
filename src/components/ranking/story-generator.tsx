"use client";

import { useState } from "react";
import { albums, rankingCategories } from "@/data/songs";
import { generateStoryImage } from "@/lib/story-canvas";
import { Download } from "lucide-react";

interface RankedSong {
  rank: number;
  title: string;
  collaborator: string | null;
}

interface StoryGeneratorProps {
  scope: "user" | "global";
  albumFilter: string;
  rankings: RankedSong[];
}

function getFilterInfo(filter: string): { label: string; coverImage?: string } {
  const album = albums.find((a) => a.slug === filter);
  if (album) return { label: album.name, coverImage: album.coverImage };

  const category = rankingCategories.find((c) => c.filter === filter);
  if (category) return { label: category.title, coverImage: category.coverImage };

  return { label: "All Albums" };
}

export function StoryGenerator({ scope, albumFilter, rankings }: StoryGeneratorProps) {
  const [loading, setLoading] = useState(false);

  if (rankings.length === 0) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const info = getFilterInfo(albumFilter);
      const blob = await generateStoryImage({
        scope,
        filterLabel: info.label,
        coverImageSrc: info.coverImage,
        songs: rankings.slice(0, 10),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gagarank-${albumFilter}-top10.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate story:", error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gaga-pink to-gaga-purple text-white font-merriweather font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? "Generating..." : "Share on Instagram"}
    </button>
  );
}
