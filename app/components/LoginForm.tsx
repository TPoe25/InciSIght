"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

type LoginFormProps = {
  callbackUrl: string;
};

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("Sign-in failed. Check your email and password and try again.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url || callbackUrl;
  };

  return (
    <main className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-rose-50 via-white to-neutral-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-600">Sign In</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sign in to save your profile preferences and get personalized ingredient explanations.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-800">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-rose-400"
              placeholder="demo@beautyscanner.app"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-800">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-rose-400"
              placeholder="Enter your password"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <Link
          href="/dashboard"
          className="mt-3 block w-full rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:border-amber-300 hover:bg-amber-50"
        >
          Continue as Guest
        </Link>

        <div className="mt-6 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">Demo account</p>
          <p className="mt-1">Email: demo@beautyscanner.app</p>
          <p>Password: beauty-demo-123</p>
        </div>

        <div className="mt-6 text-sm text-neutral-500">
          <p>
            Need an account?{" "}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              Create one
            </Link>
          </p>
        </div>

        <div className="mt-3 text-sm text-neutral-500">
          <Link href="/" className="font-medium text-rose-600 hover:text-rose-700">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
