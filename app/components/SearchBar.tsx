"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/dashboard?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        placeholder="Search product, brand, or ingredient..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-rose-400 focus:bg-white"
      />
      <button
        onClick={handleSearch}
        className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
      >
        Search
      </button>
    </div>
  );
}
