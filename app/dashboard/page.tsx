// app/dashboard/page.tsx

import SearchBar from "../components/SearchBar"
import ProductCard from "../components/ProductCard"

// Fetch products from the API based on the search query
async function getProducts(query: string) {
    const res = await fetch(
        `http://localhost:3000/api/products/search?q=${query}`,
        { cache: "no-store" }
    )
    return res.json()
}

// Render the dashboard page with the search bar and product cards
export default async function Dashboard({
    searchParams
}: {
    searchParams: { q?: string }
}) {
    const query = searchParams.q || ""
    const products = query ? await getProducts(query) : []

    // Render the dashboard with the search bar and product cards
    return (
        <div style={{ padding: 40 }}>
            <h1>Dashboard</h1>

            <SearchBar />

            <div>
                {/* Render product cards for each product in the list */}
                {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </div>
    )
}
