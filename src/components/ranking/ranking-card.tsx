"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface RankedSong {
  rank: number;
  title: string;
  collaborator: string | null;
}

interface RankingCardProps {
  filter: string;
  title: string;
  coverImage?: string;
  releaseYear?: number;
}

export function RankingCard({ filter, title, coverImage, releaseYear }: RankingCardProps) {
  const [top5, setTop5] = useState<RankedSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTop5() {
      try {
        const res = await fetch(`/api/rankings?scope=global&album=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setTop5(data.rankings.slice(0, 5));
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchTop5();
  }, [filter]);

  return (
    <Link href={`/global/${filter}`} className="block">
      <Card className="bg-gaga-card border-border hover:border-gaga-purple/50 transition-colors !pt-0 cursor-pointer">
        {/* Cover image or gradient placeholder */}
        {coverImage ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-gaga-pink/60 to-gaga-purple/60 flex items-center justify-center">
            <span className="font-merriweather text-2xl font-bold text-white text-center px-4">
              {title}
            </span>
          </div>
        )}

        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-merriweather font-bold text-lg">{title}</h3>
            {releaseYear && (
              <span className="text-xs text-muted-foreground">{releaseYear}</span>
            )}
          </div>

          {/* Top 5 */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-gaga-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : top5.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No votes yet</p>
          ) : (
            <ol className="space-y-1">
              {top5.map((song) => (
                <li key={song.rank} className="flex items-baseline gap-2 text-sm">
                  <span className="text-muted-foreground w-5 text-right shrink-0">
                    {song.rank}.
                  </span>
                  <span className="truncate">
                    {song.title}
                    {song.collaborator && (
                      <span className="text-gaga-pink text-xs ml-1">
                        ft. {song.collaborator}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="flex justify-end">
            <span className="text-sm text-gaga-purple hover:text-gaga-pink transition-colors font-medium">
              See more &rarr;
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
