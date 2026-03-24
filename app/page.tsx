// app/page.tsx

import Link from "next/link"

export default function Home() {
    return (
        <div style={{ padding: 40 }}>
            <h1>AI Beauty Scanner</h1>

            <p>Scan or search products to check ingredient safety.</p>

            <Link href="/dashboard">
                <button>Start Scanning</button>
            </Link>
        </div>
    )
}
