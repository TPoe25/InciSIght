"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/dashboard?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="flex gap-2">
      <input
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholder="Search product..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button
        className="rounded bg-black px-4 py-2 text-white"
        onClick={handleSearch}
        type="button"
      >
        Search
      </button>
    </div>
  );
}
