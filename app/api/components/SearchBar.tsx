// app/components/SearchBar.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SearchBar() {
    const [query, setQuery] = useState("")
    const router = useRouter()

    const handleSearch = () => {
        if (!query) return
        router.push(`/dashboard?q=${query}`)
    }

    return (
        <div>
            <input
                placeholder="Search product..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    )
}
