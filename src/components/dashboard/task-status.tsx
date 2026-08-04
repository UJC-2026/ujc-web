import { updateTaskStatus } from "@/app/(app)/dashboard/actions";

const OPTIONS = [
  { value: "todo", label: "Belum dikerjakan" },
  { value: "dikerjakan", label: "Sedang dikerjakan" },
  { value: "selesai", label: "Selesai" },
] as const;

/**
 * Plain form + server action so status changes work without JS. Submitting on
 * change is progressive enhancement; the button is the no-JS fallback.
 */
export function TaskStatusControl({
  taskId,
  status,
}: {
  taskId: string;
  status: "todo" | "dikerjakan" | "selesai";
}) {
  return (
    <form action={updateTaskStatus} className="flex items-center gap-1.5">
      <input type="hidden" name="taskId" value={taskId} />
      <label className="sr-only" htmlFor={`status-${taskId}`}>
        Ubah status tugas
      </label>
      <select
        id={`status-${taskId}`}
        name="status"
        defaultValue={status}
        className="h-8 rounded-field border border-border bg-surface px-2 text-caption text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-field border border-border px-2.5 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
      >
        Simpan
      </button>
    </form>
  );
}
