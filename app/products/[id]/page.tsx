import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl p-10">
      <h1 className="mb-4 text-2xl font-bold">{product.name}</h1>
      <div className="mb-4">
        <span className="rounded bg-green-200 px-3 py-1">Score: {product.baseScore ?? "N/A"}</span>
      </div>

      <div className="mb-6 rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-semibold">AI Explanation</h2>
        <p>AI insights are generated on demand from the ingredient list.</p>
      </div>

      <h3 className="mb-2 font-semibold">Ingredients</h3>
      <ul className="space-y-2">
        {product.ingredients.map((item) => (
          <li key={item.ingredient.id} className="flex justify-between border-b pb-1">
            <span>{item.ingredient.name}</span>
            <span className="text-sm text-gray-500">{item.ingredient.riskLevel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
