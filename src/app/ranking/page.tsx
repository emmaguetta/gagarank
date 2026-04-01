import { RankingTable } from "@/components/ranking/ranking-table";

export default function RankingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-3xl sm:text-4xl font-bold">
          My <span className="text-gaga-pink">Ranking</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal ranking based on your choices
        </p>
      </div>
      <RankingTable scope="user" />
    </div>
  );
}
