import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractKeyword(question: string) {
  const lower = question.toLowerCase();

  const knownIngredients = [
    "zinc oxide",
    "retinol",
    "glycerin",
    "salicylic acid",
    "niacinamide",
    "hyaluronic acid",
    "benzoyl peroxide",
    "titanium dioxide",
    "phenoxyethanol",
    "fragrance",
  ];

  for (const ingredient of knownIngredients) {
    if (lower.includes(ingredient)) return ingredient;
  }

  return lower.trim();
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const keyword = extractKeyword(message);

    const ingredient = await prisma.ingredient.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            normalizedName: {
              contains: keyword.toLowerCase(),
            },
          },
        ],
      },
    });

    if (!ingredient) {
      return NextResponse.json({
        reply: `I could not find ingredient data for "${keyword}" in the database yet.`,
      });
    }

    const reply = `
${ingredient.name} is currently marked as ${ingredient.riskLevel} risk.
${ingredient.description ? `Description: ${ingredient.description}` : ""}
${ingredient.concerns?.length ? `Concerns: ${ingredient.concerns.join(", ")}` : ""}
${ingredient.source ? `Source: ${ingredient.source}` : ""}
    `.trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Chat request failed on the server." },
      { status: 500 }
    );
  }
}
