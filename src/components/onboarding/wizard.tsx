"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  GraduationCap,
  HandHeart,
  MessagesSquare,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { KizunaMark } from "@/components/brand/motifs";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

const STEPS = ["Kenalan", "Lengkapi profil", "Fitur utama"] as const;

const TOUR = [
  {
    icon: MessagesSquare,
    title: "Forum",
    description: "Tempat bertanya dan berbagi pengalaman dengan anggota lain.",
  },
  {
    icon: GraduationCap,
    title: "Latihan CBT",
    description: "Bank soal JLPT & SSW dengan timer dan pembahasan.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Jual, lelang, atau berikan barang bekas antar anggota.",
  },
  {
    icon: HandHeart,
    title: "UJC Peduli",
    description: "Kanal solidaritas saat ada anggota yang membutuhkan bantuan.",
  },
];

export function OnboardingWizard({ profile }: { profile: Profile }) {
  const [step, setStep] = useState(0);
  const router = useRouter();

  return (
    <div className="relative isolate">
      <KizunaMark className="absolute -top-8 -right-4 -z-10 text-[10rem] text-brand-blue-100 dark:text-navy-800/40" />

      <ol className="flex items-center gap-2" aria-label="Langkah onboarding">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-pill text-caption font-semibold transition-colors",
                index < step && "bg-accent text-accent-foreground",
                index === step && "bg-primary text-primary-foreground",
                index > step && "bg-surface-muted text-muted-foreground",
              )}
            >
              {index < step ? <Check className="size-3.5" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-caption sm:block",
                index === step ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-9 rounded-panel border border-border bg-surface p-6 sm:p-8">
        {step === 0 && (
          <>
            <h1 className="rule-gold text-h2 text-foreground">
              Selamat datang di UJC, {profile.full_name.split(" ")[0]}!
            </h1>
            <p className="mt-5 text-body text-muted-foreground">
              Senang kamu bergabung. Sebelum mulai, kami butuh sedikit data
              supaya anggota lain bisa mengenalimu — terutama teman-teman yang
              tinggal di prefektur yang sama denganmu.
            </p>
            <p className="mt-3 text-body text-muted-foreground">
              Prosesnya cuma sebentar, kok.
            </p>
            <Button className="mt-8" onClick={() => setStep(1)}>
              Mulai
              <ArrowRight aria-hidden />
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="rule-gold text-h2 text-foreground">
              Lengkapi profilmu
            </h1>
            <p className="mt-5 text-body text-muted-foreground">
              Data ini dipakai untuk verifikasi keanggotaan UNSIA dan
              menghubungkanmu dengan anggota sekota.
            </p>
            <div className="mt-8">
              <ProfileForm
                profile={profile}
                submitLabel="Simpan & lanjut"
                onSaved={() => setStep(2)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="rule-gold text-h2 text-foreground">
              Yang bisa kamu lakukan di UJC
            </h1>
            <ul className="mt-8 space-y-4">
              {TOUR.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-field bg-surface-muted text-primary">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-body font-medium text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={() => router.push("/dashboard")}>
                Masuk ke dashboard
                <ArrowRight aria-hidden />
              </Button>
              <Button asChild variant="outline">
                <Link href="/help">Baca panduan lengkap</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
