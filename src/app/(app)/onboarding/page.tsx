import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = {
  title: "Selamat datang",
};

export default async function OnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarded_at) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <OnboardingWizard profile={profile} />
    </div>
  );
}
