import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun UNSIA Japan Community.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="rounded-panel border border-border bg-surface p-7 sm:p-8">
      <h1 className="text-h2 text-foreground">Selamat datang kembali</h1>
      <p className="mt-2 text-body text-muted-foreground">
        Masuk untuk lanjut berdiskusi bareng teman-teman UJC di Jepang.
      </p>

      <LoginForm next={next} initialError={error ? "Sesi masuk gagal. Silakan coba lagi." : undefined} />

      <p className="mt-6 text-center text-caption text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:text-accent">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
