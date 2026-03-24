import type { ProductScore } from "@/lib/scoring";

type ScoreBadgeProps = ProductScore;

export default function ScoreBadge({ score, color }: ScoreBadgeProps) {
  const styles =
    color === "green"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : color === "yellow"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-rose-100 text-rose-700 border-rose-200";

  return (
    <div className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${styles}`}>
      {score} • {color}
    </div>
  );
}
