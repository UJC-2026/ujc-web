import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateID } from "@/lib/format";
import { DIVISI_LABEL } from "@/lib/supabase/types";
import type { CashSummary, Program, Task } from "@/lib/dashboard/queries";
import type { UjcEvent } from "@/lib/events/types";
import type { PengurusOption } from "@/lib/dashboard/queries";
import { TaskStatusControl } from "../task-status";
import { CashForm, ProgramForm, TaskForm } from "../forms";
import type { Divisi } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const PROGRAM_VARIANT = {
  rencana: "outline",
  berjalan: "primary",
  selesai: "success",
  tertunda: "danger",
} as const;

const PROGRAM_LABEL = {
  rencana: "Rencana",
  berjalan: "Berjalan",
  selesai: "Selesai",
  tertunda: "Tertunda",
} as const;

const PRIORITY_VARIANT = {
  tinggi: "danger",
  sedang: "accent",
  rendah: "outline",
} as const;

const TASK_LABEL = {
  todo: "Belum dikerjakan",
  dikerjakan: "Sedang dikerjakan",
  selesai: "Selesai",
} as const;

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

/** Deadlines within a week, or already passed, are what needs attention. */
function isUrgent(date: string | null) {
  return date !== null && daysUntil(date) <= 7;
}

export function PerhatianPanel({
  tasks,
  programs,
}: {
  tasks: Task[];
  programs: Program[];
}) {
  const urgentTasks = tasks.filter(
    (task) => task.status !== "selesai" && isUrgent(task.due_date),
  );
  const urgentPrograms = programs.filter(
    (program) => program.status === "berjalan" && isUrgent(program.end_date),
  );

  const nothingUrgent =
    urgentTasks.length === 0 && urgentPrograms.length === 0;

  return (
    <div>
      <h2 className="text-h3 text-foreground">Butuh perhatianmu</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Tugas dan program kerja yang tenggatnya sudah dekat atau terlewat.
      </p>

      {nothingUrgent ? (
        <div className="mt-7">
          <EmptyState
            icon={Sparkles}
            title="Tidak ada yang mendesak"
            description="Tidak ada tenggat dalam sepekan ke depan. Waktu yang bagus untuk menyiapkan proker berikutnya."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          {urgentTasks.length > 0 && (
            <section>
              <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                Tugasmu
              </h3>
              <ul className="mt-3 space-y-3">
                {urgentTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </section>
          )}

          {urgentPrograms.length > 0 && (
            <section>
              <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                Proker mendekati tenggat
              </h3>
              <ul className="mt-3 space-y-3">
                {urgentPrograms.map((program) => (
                  <ProgramRow key={program.id} program={program} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramRow({ program }: { program: Program }) {
  const remaining = program.end_date ? daysUntil(program.end_date) : null;

  return (
    <li className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={PROGRAM_VARIANT[program.status]}>
          {PROGRAM_LABEL[program.status]}
        </Badge>
        <Badge variant="outline">{DIVISI_LABEL[program.divisi]}</Badge>
      </div>

      <p className="mt-2.5 text-body font-medium text-foreground">
        {program.title}
      </p>
      {program.target && (
        <p className="mt-1 text-caption text-muted-foreground">
          Target: {program.target}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        {program.pic && <span>PIC: {program.pic.full_name}</span>}
        {program.end_date && (
          <span
            className={cn(
              remaining !== null && remaining < 0 && "font-medium text-danger",
            )}
          >
            Tenggat {formatDateID(program.end_date)}
            {remaining !== null &&
              (remaining < 0
                ? ` · terlewat ${Math.abs(remaining)} hari`
                : ` · ${remaining} hari lagi`)}
          </span>
        )}
        {program.budget !== null && <span>Anggaran {yen.format(program.budget)}</span>}
      </div>
    </li>
  );
}

function TaskRow({
  task,
  editable = false,
}: {
  task: Task;
  editable?: boolean;
}) {
  const remaining = task.due_date ? daysUntil(task.due_date) : null;

  return (
    <li className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={PRIORITY_VARIANT[task.priority]}>
          Prioritas {task.priority}
        </Badge>
        {editable ? (
          <TaskStatusControl taskId={task.id} status={task.status} />
        ) : (
          <Badge variant="outline">{TASK_LABEL[task.status]}</Badge>
        )}
        {task.program && <Badge variant="neutral">{task.program.title}</Badge>}
      </div>

      <p className="mt-2.5 text-body font-medium text-foreground">{task.title}</p>
      {task.description && (
        <p className="mt-1 text-caption text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        {task.assignee && <span>Untuk: {task.assignee.full_name}</span>}
        {task.due_date && (
          <span
            className={cn(
              remaining !== null && remaining < 0 && "font-medium text-danger",
            )}
          >
            Tenggat {formatDateID(task.due_date)}
            {remaining !== null &&
              (remaining < 0
                ? ` · terlewat ${Math.abs(remaining)} hari`
                : ` · ${remaining} hari lagi`)}
          </span>
        )}
      </div>
    </li>
  );
}

export function ProkerPanel({
  programs,
  divisiOptions,
}: {
  programs: Program[];
  divisiOptions: Divisi[];
}) {
  const byStatus = {
    berjalan: programs.filter((p) => p.status === "berjalan"),
    rencana: programs.filter((p) => p.status === "rencana"),
    tertunda: programs.filter((p) => p.status === "tertunda"),
    selesai: programs.filter((p) => p.status === "selesai"),
  };

  return (
    <div>
      <h2 className="text-h3 text-foreground">Program kerja</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Proker divisi beserta penanggung jawab, tenggat, dan anggarannya.
      </p>

      <div className="mt-5">
        <ProgramForm divisiOptions={divisiOptions} />
      </div>

      {programs.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={ClipboardList}
            title="Belum ada program kerja"
            description="Proker yang sudah dicatat akan muncul di sini beserta progresnya."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-7">
          {(
            ["berjalan", "rencana", "tertunda", "selesai"] as const
          ).map((status) =>
            byStatus[status].length === 0 ? null : (
              <section key={status}>
                <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                  {PROGRAM_LABEL[status]} ({byStatus[status].length})
                </h3>
                <ul className="mt-3 space-y-3">
                  {byStatus[status].map((program) => (
                    <ProgramRow key={program.id} program={program} />
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function TugasPanel({
  tasks,
  programs,
  pengurus,
}: {
  tasks: Task[];
  programs: Program[];
  pengurus: PengurusOption[];
}) {
  const open = tasks.filter((task) => task.status !== "selesai");
  const done = tasks.filter((task) => task.status === "selesai");

  return (
    <div>
      <h2 className="text-h3 text-foreground">Tugas</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Tugas yang di-assign ke pengurus, terhubung ke proker terkait.
      </p>

      <div className="mt-5">
        <TaskForm programs={programs} pengurus={pengurus} />
      </div>

      {tasks.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={CheckCircle2}
            title="Belum ada tugas"
            description="Tugas yang dibuat pengurus akan muncul di sini lengkap dengan tenggatnya."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-7">
          {open.length > 0 && (
            <section>
              <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                Belum selesai ({open.length})
              </h3>
              <ul className="mt-3 space-y-3">
                {open.map((task) => (
                  <TaskRow key={task.id} task={task} editable />
                ))}
              </ul>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                Selesai ({done.length})
              </h3>
              <ul className="mt-3 space-y-3">
                {done.map((task) => (
                  <TaskRow key={task.id} task={task} editable />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function KeuanganPanel({
  cash,
  canRecord,
}: {
  cash: CashSummary;
  canRecord: boolean;
}) {
  const tiles = [
    { icon: Coins, label: "Pemasukan", value: cash.income, tone: "text-success" },
    { icon: Wallet, label: "Pengeluaran", value: cash.expense, tone: "text-danger" },
    { icon: Wallet, label: "Saldo kas", value: cash.balance, tone: "text-foreground" },
  ];

  return (
    <div>
      <h2 className="text-h3 text-foreground">Keuangan</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Kas komunitas. Hanya bendahara yang bisa mencatat; pengurus lain melihat
        saja.
      </p>

      {canRecord && (
        <div className="mt-5">
          <CashForm />
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-5">
            <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
              <tile.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-caption text-muted-foreground">{tile.label}</p>
            <p className={cn("mt-1 text-h3 font-semibold tabular-nums", tile.tone)}>
              {yen.format(tile.value)}
            </p>
          </Card>
        ))}
      </div>

      <h3 className="mt-8 text-caption font-semibold tracking-wide text-muted-foreground uppercase">
        Transaksi terbaru
      </h3>

      {cash.recent.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={Wallet}
            title="Belum ada transaksi"
            description="Pemasukan dan pengeluaran kas yang dicatat bendahara akan muncul di sini."
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {cash.recent.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-foreground">
                  {row.description ?? row.category ?? "Transaksi"}
                </p>
                <p className="text-caption text-muted-foreground">
                  {formatDateID(row.occurred_on)}
                  {row.category && ` · ${row.category}`}
                </p>
              </div>
              <span
                className={cn(
                  "text-body font-medium tabular-nums whitespace-nowrap",
                  row.type === "pemasukan" ? "text-success" : "text-danger",
                )}
              >
                {row.type === "pemasukan" ? "+" : "−"}
                {yen.format(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function KegiatanPanel({ events }: { events: UjcEvent[] }) {
  return (
    <div>
      <h2 className="text-h3 text-foreground">Kegiatan</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Kegiatan yang akan datang beserta jumlah peserta terdaftar.
      </p>

      {events.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={CalendarDays}
            title="Belum ada kegiatan terjadwal"
            description="Buat kegiatan baru supaya anggota bisa mulai mendaftar."
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {events.map((event) => {
            const full =
              event.capacity !== null && event.going_count >= event.capacity;

            return (
              <li
                key={event.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={event.is_online ? "accent" : "neutral"}>
                    {event.is_online ? "Online" : (event.prefecture ?? "Offline")}
                  </Badge>
                  {full && <Badge variant="danger">Kuota penuh</Badge>}
                </div>

                <p className="mt-2.5 text-body font-medium text-foreground">
                  <Link
                    href={`/events/${event.id}`}
                    className="transition-colors hover:text-primary"
                  >
                    {event.title}
                  </Link>
                </p>

                <p className="mt-1 text-caption text-muted-foreground">
                  {formatDateID(event.event_date)} ·{" "}
                  {event.going_count.toLocaleString("id-ID")} akan hadir
                  {event.capacity !== null && ` dari kuota ${event.capacity}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
