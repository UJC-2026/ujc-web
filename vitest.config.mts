import { defineConfig } from "vitest/config";

/**
 * Unit tests only, for the pure logic that decides what a member sees:
 * search and scoping, structured-data shapes, and which database errors are
 * safe to show. No jsdom and no React plugin — nothing here renders a
 * component.
 *
 * The parts this cannot reach are the ones the README already tests by hand
 * against a real local Supabase: RLS, triggers, and async Server Components.
 */
export default defineConfig({
  // Resolves the `@/*` paths from tsconfig. Vite does this natively now; the
  // vite-tsconfig-paths plugin the Next.js guide still recommends prints a
  // deprecation notice telling you to use this instead.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // `@/lib/env` validates on import and would abort the run otherwise. These
    // are placeholders; nothing here reaches Supabase.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_SITE_URL: "https://ujc.test",
    },
  },
});
