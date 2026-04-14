import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignUpForm from "../components/SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  return <SignUpForm callbackUrl={callbackUrl} />;
}
