"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { answerRequest, withdrawRequest } from "@/app/(app)/mentorship/actions";
import type { MentorshipRequest, RequestStatus } from "@/lib/mentorship/queries";

const STATUS_LABEL: Record<RequestStatus, string> = {
  menunggu: "Menunggu jawaban",
  diterima: "Berjalan",
  ditolak: "Ditolak",
  selesai: "Selesai",
};

const STATUS_VARIANT: Record<RequestStatus, "outline" | "primary" | "danger" | "success"> = {
  menunggu: "outline",
  diterima: "primary",
  ditolak: "danger",
  selesai: "success",
};

function AnswerButtons({ requestId, status }: { requestId: string; status: RequestStatus }) {
  const [busy, setBusy] = useState(false);

  async function answer(next: "diterima" | "ditolak" | "selesai") {
    setBusy(true);
    const data = new FormData();
    data.set("requestId", requestId);
    data.set("status", next);
    const result = await answerRequest({}, data);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else toast.success(result.success);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "menunggu" && (
        <>
          <Button size="sm" disabled={busy} onClick={() => answer("diterima")}>
            Terima
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => answer("ditolak")}>
            Tolak
          </Button>
        </>
      )}
      {status === "diterima" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => answer("selesai")}>
          Tandai selesai
        </Button>
      )}
    </div>
  );
}

export function RequestList({
  requests,
  asMentor,
}: {
  requests: MentorshipRequest[];
  asMentor: boolean;
}) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li key={request.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[request.status]}>
              {STATUS_LABEL[request.status]}
            </Badge>
            <span className="text-caption text-muted-foreground">
              {relativeTime(request.created_at)}
            </span>
          </div>

          {asMentor && request.mentee && (
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar src={request.mentee.avatar_url} name={request.mentee.full_name} size="sm" />
              <p className="text-caption font-medium text-foreground">
                {request.mentee.full_name}
              </p>
            </div>
          )}

          {request.message && (
            <p className="mt-3 text-body whitespace-pre-line text-muted-foreground">
              {request.message}
            </p>
          )}

          <div className="mt-4">
            {asMentor ? (
              <AnswerButtons requestId={request.id} status={request.status} />
            ) : request.status === "menunggu" ? (
              <form action={withdrawRequest}>
                <input type="hidden" name="requestId" value={request.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Tarik permintaan
                </Button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
