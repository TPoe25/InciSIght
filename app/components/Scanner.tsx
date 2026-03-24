"use client";

import { useState } from "react";

export default function Scanner() {
    const [image, setImage] = useState<File | null>(null);
    const [status, setStatus] = useState("");

    const handleUpload = async () => {
        if (!image) return;

        setStatus("Scanning ingredient label...");

        const formData = new FormData();
        formData.append("file", image);

        const res = await fetch("/api/scans/upload", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        setStatus(`Detected: ${data.text || "No text found"}`);
    };

    return (
        <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition hover:border-rose-400 hover:bg-rose-50">
                <span className="text-sm font-medium text-neutral-700">
                    Upload ingredient label
                </span>
                <span className="mt-1 text-xs text-neutral-500">
                    PNG, JPG, or WEBP
                </span>

                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
            </label>

            {image && (
                <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                    Selected: <span className="font-medium">{image.name}</span>
                </div>
            )}

            <button
                onClick={handleUpload}
                className="w-full rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
                Scan Product
            </button>

            {status && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {status}
                </div>
            )}
        </div>
    );
}
