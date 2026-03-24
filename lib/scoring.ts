type IngredientRisk = {
  riskLevel: string;
};

export type ProductScore = {
  score: number;
  color: "green" | "yellow" | "red";
};

export function calculateScore(ingredients: IngredientRisk[]): ProductScore {
  let score = 100;

  for (const ingredient of ingredients) {
    if (ingredient.riskLevel === "high") score -= 20;
    if (ingredient.riskLevel === "moderate") score -= 10;
  }

  if (score >= 80) return { score, color: "green" };
  if (score >= 50) return { score, color: "yellow" };
  return { score, color: "red" };
}
