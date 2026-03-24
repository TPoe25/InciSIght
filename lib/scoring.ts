type IngredientInput = {
  riskLevel: string;
  riskScore?: number | null;
};

export function calculateScore(ingredients: IngredientInput[]) {
  let score = 100;

  for (const ingredient of ingredients) {
    if (typeof ingredient.riskScore === "number") {
      score -= ingredient.riskScore;
      continue;
    }

    if (ingredient.riskLevel === "high") score -= 20;
    if (ingredient.riskLevel === "moderate") score -= 10;
    if (ingredient.riskLevel === "low") score -= 0;
  }

  if (score < 0) score = 0;

  if (score >= 80) return { score, color: "green" };
  if (score >= 50) return { score, color: "yellow" };
  return { score, color: "red" };
}
