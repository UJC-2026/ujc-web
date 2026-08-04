import type { Metadata } from "next";
import { requireModerator } from "@/lib/admin/queries";
import { AdminNav } from "@/components/admin/admin-nav";
import { RoleBadge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · UJC" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireModerator();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="rule-gold text-h1 text-foreground">Panel pengelola</h1>
          <p className="mt-5 text-body text-muted-foreground">
            Moderasi konten, kelola anggota, dan pantau kesehatan komunitas.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-caption text-muted-foreground">
            {profile.full_name}
          </span>
          <RoleBadge role={profile.role} />
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row">
        <AdminNav isAdmin={profile.role === "admin"} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
