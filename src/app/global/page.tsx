import { albums, rankingCategories } from "@/data/songs";
import { RankingCard } from "@/components/ranking/ranking-card";

export default function GlobalRankingPage() {
  const cards = [
    // 3 special categories first
    ...rankingCategories.map((cat) => ({
      filter: cat.filter,
      title: cat.title,
      coverImage: cat.coverImage as string | undefined,
      releaseYear: undefined as number | undefined,
    })),
    // Then all 11 albums in order
    ...albums.map((album) => ({
      filter: album.slug,
      title: album.name,
      coverImage: album.coverImage,
      releaseYear: album.releaseYear,
    })),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold">
          <span className="text-gaga-purple">Global</span> Ranking
        </h1>
        <p className="text-muted-foreground mt-2">
          Community ranking, based on all votes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <RankingCard
            key={card.filter}
            filter={card.filter}
            title={card.title}
            coverImage={card.coverImage}
            releaseYear={card.releaseYear}
          />
        ))}
      </div>
    </div>
  );
}
