import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { KizunaMark, NamiPattern } from "@/components/brand/motifs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden px-4 py-14 sm:py-20">
      <KizunaMark className="absolute -top-10 -right-6 -z-10 text-[14rem] text-brand-blue-100 opacity-60 dark:text-navy-800/40" />
      <NamiPattern className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-brand-blue-100 dark:text-navy-800/50" />

      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        {children}
      </div>
    </div>
  );
}
