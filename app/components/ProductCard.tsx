// app/components/ProductCard.tsx

import Link from "next/link"
import ScoreBadge from "./ScoreBadge"

// ProductCard component to display product information and a link to the product details page
export default function ProductCard({ product }: any) {   // Accepts a product object as a prop
    return (
        // Container for the product card with styling
        <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 10 }}>
            <h3>{product.name}</h3>

            {/* Display the product's base score using the ScoreBadge component */}
            <ScoreBadge score={product.baseScore} color={product.scoreColor} />

            {/* Link to the product details page with the product ID */}
            <Link href={`/products/${product.id}`}>
                <button>View Details</button>
            </Link>
        </div>
    )
}
