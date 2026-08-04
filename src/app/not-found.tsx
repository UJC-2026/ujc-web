import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToriiMark } from "@/components/brand/motifs";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-28 text-center">
      <ToriiMark className="w-24 text-accent" />
      <p className="mt-8 text-h1 font-semibold text-primary">404</p>
      <h1 className="mt-3 text-h2 text-foreground">Halamannya nyasar</h1>
      <p className="mt-4 text-body text-muted-foreground">
        Sepertinya kamu salah belok — halaman ini tidak ada. Tenang, gerbangnya
        masih terbuka.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
