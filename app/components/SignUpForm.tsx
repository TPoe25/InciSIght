"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

type SignUpFormProps = {
  callbackUrl: string;
};

export default function SignUpForm({ callbackUrl }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      setError(registerData.error || "Unable to create account.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Account created, but automatic sign-in failed. Please sign in manually.");
      setLoading(false);
      return;
    }

    window.location.href = signInResult?.url || callbackUrl;
  };

  return (
    <main className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-amber-50 via-white to-rose-50 px-6 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-600">
          Create Account
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
          Set up your profile
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create an account to save your skin preferences, allergies, and personalized ingredient explanations.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-800">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-rose-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-800">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-rose-400"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-800">Confirm password</span>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-rose-400"
              placeholder="Repeat your password"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <Link
          href="/dashboard"
          className="mt-3 block w-full rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-semibold text-neutral-900 transition hover:border-amber-300 hover:bg-amber-50"
        >
          Continue as Guest
        </Link>

        <div className="mt-6 text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-medium text-rose-600 hover:text-rose-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
