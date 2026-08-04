"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/google-button";
import { signUp, type AuthState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      {pending ? "Mendaftarkan…" : "Buat akun"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});

  if (state.success) {
    return (
      <div className="mt-7 rounded-card border border-accent/40 bg-accent-muted/40 px-5 py-6 text-center">
        <MailCheck className="mx-auto size-8 text-accent" aria-hidden />
        <h2 className="mt-3 text-h3 text-foreground">Cek emailmu</h2>
        <p className="mt-2 text-body text-muted-foreground">{state.success}</p>
        <p className="mt-3 text-caption text-muted-foreground">
          Tidak ketemu? Coba lihat folder spam atau promosi.
        </p>
      </div>
    );
  }

  return (
    <>
      <form action={formAction} className="mt-7 space-y-4">
        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </p>
        )}

        <Field label="Nama lengkap" htmlFor="fullName">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            placeholder="Nama sesuai data kampus"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
          />
        </Field>

        <Field
          label="Kata sandi"
          htmlFor="password"
          hint="Minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka."
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
        </Field>

        <Field label="Ulangi kata sandi" htmlFor="confirmPassword">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
        </Field>

        <SubmitButton />
      </form>

      <div className="my-6 flex items-center gap-3 text-caption text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />
    </>
  );
}
