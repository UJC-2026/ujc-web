import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProfile, getPengurusRoles } from "@/lib/auth/session";
import {
  getCashSummary,
  getMemberSummary,
  getAdministrasi,
  getAkademikWorkspace,
  getBoardPosts,
  getLeaderboard,
  getUnifiedCalendar,
  getMediaWorkspace,
  getPengurusOptions,
  getPrograms,
  getRecentActivity,
  getTasks,
} from "@/lib/dashboard/queries";
import { getEvents } from "@/lib/events/queries";
import { getPeduliReviewQueue } from "@/lib/peduli/queries";
import {
  canOpenPanel,
  isPanelId,
  visiblePanels,
  type PanelId,
} from "@/lib/dashboard/panels";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import {
  AktivitasPanel,
  RingkasanPanel,
} from "@/components/dashboard/panels/member-panels";
import {
  KegiatanPanel,
  KeuanganPanel,
  PerhatianPanel,
  ProkerPanel,
  TugasPanel,
} from "@/components/dashboard/panels/pengurus-panels";
import {
  AdministrasiPanel,
  AkademikPanel,
  MediaPanel,
} from "@/components/dashboard/panels/divisi-panels";
import {
  KalenderPanel,
  PapanPanel,
} from "@/components/dashboard/panels/coordination-panels";
import { PeduliPanel } from "@/components/dashboard/panels/peduli-panel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DIVISI_LABEL } from "@/lib/supabase/types";
import { DIVISI_VALUES } from "@/lib/validations/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

async function renderPanel(
  panel: PanelId,
  userId: string,
  fullName: string,
  isPengurus: boolean,
  canReviewPeduli: boolean,
) {
  switch (panel) {
    case "aktivitas":
      return <AktivitasPanel items={await getRecentActivity(userId)} />;

    case "perhatian": {
      // Leadership sees every division's work; other pengurus see their own.
      const [tasks, programs] = await Promise.all([
        getTasks(),
        getPrograms(),
      ]);
      return <PerhatianPanel tasks={tasks} programs={programs} />;
    }

    case "proker": {
      // Leadership may file a proker under any division; everyone else is
      // limited to their own, matching the "divisi kelola prokernya" policy.
      const divisiOptions = [...DIVISI_VALUES];
      return (
        <ProkerPanel
          programs={await getPrograms()}
          divisiOptions={divisiOptions}
        />
      );
    }

    case "tugas": {
      const [tasks, programs, pengurus] = await Promise.all([
        getTasks(),
        getPrograms(),
        getPengurusOptions(),
      ]);
      return <TugasPanel tasks={tasks} programs={programs} pengurus={pengurus} />;
    }

    case "keuangan":
      return (
        <KeuanganPanel
          cash={await getCashSummary()}
          canRecord={isPengurus}
        />
      );

    case "kegiatan":
      return <KegiatanPanel events={await getEvents({ scope: "upcoming" })} />;

    case "papan":
      return <PapanPanel posts={await getBoardPosts()} />;

    case "kalender":
      return <KalenderPanel entries={await getUnifiedCalendar()} />;

    case "peduli":
      return (
        <PeduliPanel
          cases={await getPeduliReviewQueue()}
          canReview={canReviewPeduli}
        />
      );

    case "administrasi": {
      const { notes, documents } = await getAdministrasi();
      return (
        <AdministrasiPanel
          notes={notes}
          documents={documents}
          canWrite={isPengurus}
        />
      );
    }

    case "media": {
      const { slots, announcements } = await getMediaWorkspace();
      return (
        <MediaPanel
          slots={slots}
          announcements={announcements}
          canWrite={isPengurus}
        />
      );
    }

    case "akademik": {
      const { categories, resourceCount } = await getAkademikWorkspace();
      return (
        <AkademikPanel categories={categories} resourceCount={resourceCount} />
      );
    }

    case "ringkasan":
    default: {
      const [summary, leaderboard] = await Promise.all([
        getMemberSummary(userId),
        getLeaderboard(),
      ]);
      return (
        <RingkasanPanel
          summary={summary}
          name={fullName}
          leaderboard={leaderboard}
          meId={userId}
        />
      );
    }
  }
}

/**
 * One route for every panel. The active panel comes from `?panel=`, so only
 * that panel's data is fetched per request rather than all of it at once, and
 * the server re-checks access instead of trusting the menu it just rendered.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const profile = await requireProfile();
  if (!profile.onboarded_at) redirect("/onboarding");

  const [{ panel: requested }, roles] = await Promise.all([
    searchParams,
    getPengurusRoles(profile.id),
  ]);

  const panels = visiblePanels(roles);
  const active: PanelId =
    isPanelId(requested) && canOpenPanel(requested, roles)
      ? requested
      : "ringkasan";

  const isPengurus = roles.length > 0 || profile.role === "admin";
  // Mirrors is_pimpinan() in the database, which owns the actual permission.
  const canReviewPeduli =
    roles.includes("ketua") || roles.includes("wakil") || profile.role === "admin";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
        <div className="min-w-0">
          <h1 className="text-h2 text-foreground">{profile.full_name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {roles.length === 0 ? (
              <Badge variant="outline">Anggota</Badge>
            ) : (
              roles.map((divisi) => (
                <Badge key={divisi} variant="accent">
                  {DIVISI_LABEL[divisi]}
                </Badge>
              ))
            )}
          </div>
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row">
        <DashboardNav panels={panels} active={active} />
        <main className="min-w-0 flex-1">
          {await renderPanel(
            active,
            profile.id,
            profile.full_name,
            isPengurus,
            canReviewPeduli,
          )}
        </main>
      </div>
    </div>
  );
}
