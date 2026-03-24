// app/api/products/search/route.ts

import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""

  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive"
      }
    },
    include: {
      ingredients: {
        include: { ingredient: true }
      }
    }
  })

  return Response.json(products)
}
