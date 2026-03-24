// app/api/scans/route.ts

import { prisma } from "@/lib/prisma"
import { calculateScore } from "@/lib/scoring"

// This function handles the POST request to create a new scan. It retrieves the product and its ingredients from the database, calculates the score based on the ingredients, and then creates a new scan record in the database with the calculated score and color.
export async function POST(req: Request) {
  const body = await req.json()

  // Retrieve the product and its ingredients from the database using Prisma. The product is identified by the productId provided in the request body. The ingredients are included in the query result, and each ingredient's details are also included.
  const product = await prisma.product.findUnique({
    where: { id: body.productId },
    include: {
      ingredients: { include: { ingredient: true } }
    }
  })

  // If the product is not found or does not have ingredients, return a 404 Not Found response.
  const ingredients = product?.ingredients.map(i => i.ingredient)

  // If the ingredients are not provided, return a 400 Bad Request response.
  const result = calculateScore(ingredients || [])

  // If the score calculation fails, return a 500 Internal Server Error response.
  const scan = await prisma.scan.create({
    data: {
      productId: product?.id,
      score: result.score,
      color: result.color
    }
  })
  // Return the created scan record as the response.
  return Response.json(scan)
}
