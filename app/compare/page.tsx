"use client";

import { useState } from "react";
import type { ProductScore } from "@/lib/scoring";

type CompareResult = {
  better: string;
  scoreA: ProductScore;
  scoreB: ProductScore;
  productA?: { id: string; name: string };
  productB?: { id: string; name: string };
  error?: string;
};

export default function ComparePage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);

  const compare = async () => {
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ a, b }),
    });

    const data: CompareResult = await res.json();
    setResult(data);
  };

  return (
    <div className="mx-auto max-w-xl p-10">
      <h1 className="mb-4 text-2xl font-bold">Compare Products</h1>

      <input
        placeholder="Product A ID"
        onChange={(e) => setA(e.target.value)}
        className="mb-2 w-full border p-2"
      />

      <input
        placeholder="Product B ID"
        onChange={(e) => setB(e.target.value)}
        className="mb-4 w-full border p-2"
      />

      <button onClick={compare} className="rounded bg-blue-500 px-4 py-2 text-white">
        Compare
      </button>

      {result && (
        <div className="mt-6 rounded bg-white p-4 shadow">
          {"error" in result && result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <p>Better Choice: {result.better}</p>
              <p>
                {result.productA?.name ?? "Product A"}: {result.scoreA.score}
              </p>
              <p>
                {result.productB?.name ?? "Product B"}: {result.scoreB.score}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
