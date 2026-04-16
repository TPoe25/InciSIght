"use client";

import { useState } from "react";

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async () => {
    if (!message.trim()) {
      setError("Please type a question first.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    const currentMessage = message;

    try {
      console.log("Sending message:", currentMessage);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: currentMessage }),
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResponse(data.reply || "No response returned.");
      setMessage("");
    } catch (err) {
      console.error("Chat request failed:", err);
      setError("Request failed. Check browser console and terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-24 right-4 z-[99999] isolate">
      <div className="w-80 rounded-xl border border-gray-300 bg-white p-3 shadow-2xl">
        <div className="mb-2 text-sm font-bold">Ask Ingredient</div>

        <input
          className="mb-2 w-full rounded border p-2 text-sm"
          placeholder="Ask about an ingredient..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={loading}
          className="w-full cursor-pointer rounded bg-black p-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>

        {error && (
          <div className="mt-2 rounded bg-red-100 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-2 rounded bg-gray-100 p-2 text-sm">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
