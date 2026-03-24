import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const fragrance = await prisma.ingredient.upsert({
    where: { name: "Fragrance" },
    update: {},
    create: {
      name: "Fragrance",
      riskLevel: "moderate",
      riskScore: 25,
      description: "Common fragrance ingredient that may irritate sensitive skin.",
      reviewBucket: "moderate_context",
    },
  });

  const glycerin = await prisma.ingredient.upsert({
    where: { name: "Glycerin" },
    update: {},
    create: {
      name: "Glycerin",
      riskLevel: "low",
      riskScore: 2,
      description: "Humectant used for hydration.",
      reviewBucket: "mvp_safe",
    },
  });

  await prisma.ingredientAlias.upsert({
    where: { alias: "Parfum" },
    update: {},
    create: {
      alias: "Parfum",
      ingredientId: fragrance.id,
    },
  });

  await prisma.product.upsert({
    where: { barcode: "111111111111" },
    update: {},
    create: {
      name: "Hydrating Face Wash",
      brand: "GlowPure",
      category: "cleanser",
      barcode: "111111111111",
      baseScore: 74,
      scoreColor: "yellow",
      ingredients: {
        create: [
          { ingredientId: fragrance.id },
          { ingredientId: glycerin.id },
        ],
      },
    },
  });

  console.log("Seed complete");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
