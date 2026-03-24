import type { ProductScore } from "@/lib/scoring";

type ScoreBadgeProps = ProductScore;

export default function ScoreBadge({ score, color }: ScoreBadgeProps) {
  const bg =
    color === "green"
      ? "lightgreen"
      : color === "yellow"
        ? "khaki"
        : "lightcoral";

  return (
    <div style={{ background: bg, padding: 6, display: "inline-block" }}>
      {score} ({color})
    </div>
  );
}
