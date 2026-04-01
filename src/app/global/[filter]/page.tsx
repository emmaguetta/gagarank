import Link from "next/link";
import Image from "next/image";
import { albums, rankingCategories } from "@/data/songs";
import { RankingTable } from "@/components/ranking/ranking-table";

function getFilterInfo(filter: string) {
  const album = albums.find((a) => a.slug === filter);
  if (album) {
    return { title: album.name, coverImage: album.coverImage, releaseYear: album.releaseYear };
  }
  const category = rankingCategories.find((c) => c.filter === filter);
  if (category) {
    return { title: category.title, coverImage: category.coverImage };
  }
  return { title: filter };
}

export default async function FilterPage({
  params,
}: {
  params: Promise<{ filter: string }>;
}) {
  const { filter } = await params;
  const info = getFilterInfo(filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/global"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        &larr; Back to Global Ranking
      </Link>

      <div className="text-center mb-8">
        {info.coverImage && (
          <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden">
            <Image
              src={info.coverImage}
              alt={info.title}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
        )}
        {!info.coverImage && (
          <div className="w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gaga-pink/60 to-gaga-purple/60 flex items-center justify-center">
            <span className="font-playfair text-2xl font-bold text-white text-center px-4">
              {info.title}
            </span>
          </div>
        )}
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold">
          {info.title}
        </h1>
        {info.releaseYear && (
          <p className="text-muted-foreground mt-1">{info.releaseYear}</p>
        )}
      </div>

      <RankingTable scope="global" initialFilter={filter} showFilter={false} />
    </div>
  );
}
