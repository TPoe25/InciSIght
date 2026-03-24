// prisma/seed.ts

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// Seed the database with some ingredients and a product with their ingredients
async function main() {
    const fragrance = await prisma.ingredient.create({
        data: { name: "Fragrance", riskLevel: "moderate", riskScore: 20 }
    })
    // Create other ingredients with their risk levels and risk scores...
    const glycerin = await prisma.ingredient.create({
        data: { name: "Glycerin", riskLevel: "low", riskScore: 2 }
    })
    // Create a product and link it to the ingredients
    const product = await prisma.product.create({
        data: {
            name: "Face Cleanser",
            baseScore: 75,
            scoreColor: "yellow",
            ingredients: {
                create: [
                    { ingredientId: fragrance.id },
                    { ingredientId: glycerin.id }
                ]
            }
        }
    })
    // Print the created product and its ingredients
    console.log(product)
}
// Run the main function and catch any errors
main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
