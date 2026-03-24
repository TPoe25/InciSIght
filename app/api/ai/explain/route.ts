import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const bodySchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: Request) {
  try {
    if (!env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const parsedBody = bodySchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return Response.json({ error: "A non-empty ingredients array is required." }, { status: 400 });
    }

    const prompt = [
      "Analyze this cosmetic ingredient list for safety.",
      "",
      parsedBody.data.ingredients.join(", "),
      "",
      "Return a short response with:",
      "- safety summary",
      "- flagged ingredients",
      "- recommendation",
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({
      explanation: response.choices[0]?.message?.content ?? "No explanation returned.",
    });
  } catch (error) {
    console.error("AI explanation failed", error);
    return Response.json(
      { error: "Unable to generate an AI explanation right now." },
      { status: 500 }
    );
  }
}
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
