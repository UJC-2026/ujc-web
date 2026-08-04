# UNSIA Japan Community (UJC)

Website komunitas mahasiswa program distance learning Universitas Siber Asia
yang tinggal dan bekerja di Jepang.

## Tech stack

Next.js 16 (App Router, React 19) · TypeScript strict · Tailwind CSS v4 ·
Supabase (Postgres + RLS + Auth) · Radix UI · React Hook Form + Zod ·
Framer Motion · next-themes · Sonner

## Setup

### 1. Dependencies

```bash
pnpm install
```

### 2. Supabase

Buat project di [supabase.com](https://supabase.com), lalu jalankan migrasi
di SQL Editor **berurutan**:

| Berkas | Isi |
| --- | --- |
| `supabase/migrations/0001_core_identity.sql` | Profil, role, kepengurusan, struktur organisasi, fungsi helper RLS |
| `supabase/migrations/0002_community.sql` | Forum, event, workshop, blog, galeri, gamifikasi |
| `supabase/migrations/0003_features.sql` | Marketplace, CBT, lowongan, mentorship, UJC Peduli, bisnis, peta |
| `supabase/migrations/0004_platform.sql` | DM, notifikasi, moderasi, ruang kerja pengurus |
| `supabase/migrations/0005_forum_triggers.sql` | Trigger skor vote & jumlah balasan, kata kunci moderasi otomatis |
| `supabase/seed.sql` | Kategori forum, periode kepengurusan, kategori CBT |

### 3. Environment variables

```bash
cp .env.example .env.local
```

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari
Supabase → Project Settings → API.

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (mis. membaca bank soal CBT
tanpa membocorkan kunci jawaban) — jangan pernah diekspos ke client.

### 4. Jalankan

```bash
pnpm dev
```

## Model akses

Ada dua sumbu otorisasi yang berjalan berdampingan:

- **`profiles.role`** (`admin` / `moderator` / `member`) — moderasi konten publik.
- **`pengurus.divisi`** (`ketua`, `wakil`, `sekretaris`, `bendahara`, `media`,
  `pendidikan`, `acara`) — akses ke ruang kerja internal pengurus.

Pola RLS untuk data pengurus: **divisi pemilik boleh menulis, pengurus lain
hanya membaca.** Ketua & wakil punya akses baca menyeluruh untuk ikhtisar, tapi
tetap mengikuti aturan divisi untuk menulis. Anggota biasa tidak bisa mengakses
data pengurus sama sekali.

Helper yang dipakai policy: `is_admin()`, `is_moderator()`, `is_pengurus()`,
`has_divisi(...)`, `is_pimpinan()`.

### Menjadikan seseorang admin

`role` tidak bisa diubah sendiri oleh pengguna (dijaga trigger
`profiles_guard_privileges`). Set admin pertama lewat SQL Editor:

```sql
update profiles set role = 'admin' where id = '<user-uuid>';
```

## Status implementasi

Sudah jalan:

- Design system (token biru navy–emas, skala tipografi, dark mode, motif kizuna/torii)
- Komponen inti: Button, Card, Badge, Input, Avatar, EmptyState, Skeleton, Toast
- Skema database lengkap (50 tabel) + RLS
- Auth: daftar, masuk, Google OAuth, verifikasi email, proteksi route via `proxy.ts`
- Onboarding wizard + halaman profil dengan indikator kelengkapan
- Landing page: hero beranimasi, count-up statistik, scroll-reveal
- Halaman sistem bertema (404, error boundary) + PWA manifest
- **Forum**: kategori, list thread (cari / urutkan / paginasi), detail thread,
  balasan bertingkat 2 level, vote naik-turun, pin oleh moderator, laporkan
  konten, editor rich text Tiptap, filter kata kunci otomatis, notifikasi balasan

Belum dikerjakan: marketplace, CBT, events, members, dashboard pengurus,
dan halaman lain sesuai spesifikasi.

## Catatan implementasi

**Sanitasi rich text.** Konten forum disimpan sebagai HTML dan dibersihkan
dua kali — saat ditulis ([`sanitizeRichText`](src/lib/sanitize.ts)) dan saat
dirender. Allowlist tag-nya sengaja dibatasi persis pada apa yang bisa
dihasilkan toolbar Tiptap.

**Hasil server action jangan ditangani lewat `useEffect`.** Efek yang bergantung
pada `state.success` tidak jalan lagi kalau pesan suksesnya sama persis, jadi
submit kedua tidak mereset form. Form di project ini memanggil server action
langsung di dalam handler `action` dan menangani hasilnya di sana.

**`loading.tsx` dan status 404.** File `loading.tsx` membuat segment-nya
di-stream, sehingga header 200 sudah terkirim sebelum `notFound()` sempat jalan
— hasilnya soft-404 yang buruk untuk SEO. Karena `loading.tsx` juga berlaku
untuk segment anak, skeleton `/forum` ditaruh di route group `(index)` supaya
tidak ikut membungkus `/forum/[category]`.
