import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import { z } from "zod";

export const runtime = "nodejs";

const compareSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsedBody = compareSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return Response.json({ error: "Two product ids are required." }, { status: 400 });
    }

    const { a, b } = parsedBody.data;

    const productA = await prisma.product.findUnique({
      where: { id: a },
      include: { ingredients: { include: { ingredient: true } } },
    });

    const productB = await prisma.product.findUnique({
      where: { id: b },
      include: { ingredients: { include: { ingredient: true } } },
    });

    if (!productA || !productB) {
      return Response.json(
        { error: "Both products must exist to compare them." },
        { status: 404 }
      );
    }

    const scoreA = calculateScore(productA.ingredients.map((item) => item.ingredient));
    const scoreB = calculateScore(productB.ingredients.map((item) => item.ingredient));

    return Response.json({
      better: scoreA.score > scoreB.score ? "Product A" : "Product B",
      scoreA,
      scoreB,
      productA: { id: productA.id, name: productA.name },
      productB: { id: productB.id, name: productB.name },
    });
  } catch (error) {
    console.error("Compare request failed", error);
    return Response.json({ error: "Unable to compare products." }, { status: 500 });
  }
}
