import { auth } from "@/lib/auth";
import ProfileSettings from "../components/ProfileSettings";
import Scanner from "../components/Scanner";
import SearchBar from "../components/SearchBar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getDashboardProfile(email: string) {

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user?.profile) {
    return null;
  }

  return {
    skinType: user.profile.skinType ?? null,
    preferences: Array.isArray(user.profile.preferences)
      ? user.profile.preferences.filter((value): value is string => typeof value === "string")
      : [],
    allergies: Array.isArray(user.profile.allergies)
      ? user.profile.allergies.filter((value): value is string => typeof value === "string")
      : [],
  };
}

export default async function Dashboard() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const profile = await getDashboardProfile(email);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-rose-50/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-rose-600">
              Dashboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
              InciSight
            </h1>
            <p className="mt-2 max-w-2xl text-neutral-600">
              Search products, scan ingredient labels, and get AI-powered
              insights in one place.
            </p>
            <p className="mt-3 text-sm text-neutral-500">Signed in as {email}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-neutral-500">Status</p>
            <p className="font-semibold text-neutral-900">
              Personalized features enabled
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Search Products
            </h2>
            <SearchBar />
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">
              Scan Ingredient Label
            </h2>
            <Scanner />
          </section>
        </div>

        <div className="mt-6" id="profile-settings">
          <ProfileSettings initialProfile={profile} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Fast Check</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              Red / Yellow / Green
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Instant product scoring for easier decision-making.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">AI Explanation</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              Understand why for you
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Clear ingredient summaries tuned to your saved profile.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-neutral-500">Compare</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              Better product choices
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Compare similar products side by side before buying.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
