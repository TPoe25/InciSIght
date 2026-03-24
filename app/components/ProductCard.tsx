import Link from "next/link";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    baseScore: number | null;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="mb-3 rounded bg-white p-4 shadow">
      <h3 className="font-semibold">{product.name}</h3>
      <div className="mt-2 text-sm text-gray-600">Score: {product.baseScore ?? "N/A"}</div>
      <Link className="mt-3 inline-block text-blue-500" href={`/products/${product.id}`}>
        View Details →
      </Link>
    </div>
  );
}
