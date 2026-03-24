// lib/scoring.ts

// This function calculates a score based on the risk levels of the ingredients.
export function calculateScore(ingredients: any[]) {
    let score = 100

    // Decrease the score based on the risk level of each ingredient.
    for (const ing of ingredients) {
        if (ing.riskLevel === "high") score -= 20
        if (ing.riskLevel === "moderate") score -= 10
    }

    // Return the final score and color based on the risk level.
    if (score >= 80) return { score, color: "green" }
    if (score >= 50) return { score, color: "yellow" }
    return { score, color: "red" }
}
