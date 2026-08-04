import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun UNSIA Japan Community.",
};

export default function RegisterPage() {
  return (
    <div className="rounded-panel border border-border bg-surface p-7 sm:p-8">
      <h1 className="text-h2 text-foreground">Gabung ke UJC</h1>
      <p className="mt-2 text-body text-muted-foreground">
        Satu wadah untuk mahasiswa UNSIA yang kuliah sambil kerja di Jepang.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-caption text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-accent">
          Masuk di sini
        </Link>
      </p>

      <p className="mt-4 text-center text-caption text-muted-foreground">
        Dengan mendaftar kamu menyetujui{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-primary">
          Ketentuan Layanan
        </Link>{" "}
        dan{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
          Kebijakan Privasi
        </Link>{" "}
        UJC.
      </p>
    </div>
  );
}
