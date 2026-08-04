# UNSIA Japan Community (UJC)

Website komunitas untuk mahasiswa program *distance learning* Universitas Siber
Asia yang tinggal dan bekerja di Jepang — kuliah daring sambil kerja penuh
waktu, sering diakses dari HP di sela shift.

## Tech stack

Next.js 16 (App Router, React 19) · TypeScript strict · Tailwind CSS v4 ·
Supabase (Postgres + RLS + Auth + Storage + Realtime) · Radix UI ·
Zod · Tiptap · Framer Motion · Leaflet · next-themes · Sonner

## Menjalankan secara lokal

```bash
pnpm install
npx supabase start      # Postgres + Auth + Storage + Realtime lewat Docker
pnpm dev
```

`supabase start` menjalankan seluruh migrasi di `supabase/migrations/` secara
berurutan lalu menerapkan `supabase/seed.sql`, jadi database langsung berisi
data contoh yang bisa dipakai.

Akun seed (khusus lokal, kata sandi `password123`):

| Email | Peran |
| --- | --- |
| `admin@ujc.test` | admin situs + ketua |
| `moderator@ujc.test` | moderator + divisi pendidikan |
| `acara@ujc.test` | anggota + divisi kegiatan |
| `member@ujc.test` | anggota biasa |

Salin kredensial dari keluaran `supabase start` ke `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` opsional dan hanya untuk server — jangan pernah
diekspos ke client.

> Port lokal digeser ke 55321+ di `supabase/config.toml` agar tidak bentrok
> dengan project Supabase lain di mesin yang sama. Kalau muncul 502 setelah
> `supabase db reset`, restart container `supabase_kong_*`: IP container auth
> berubah dan Kong menyimpan yang lama.

Untuk menaikkan ke produksi (Supabase + Vercel), ikuti
[DEPLOYMENT.md](DEPLOYMENT.md) — urutannya mengikat, dan `seed.sql` tidak
boleh ikut ke produksi.

## Model akses

Dua sumbu otorisasi berjalan berdampingan:

- **`profiles.role`** (`admin` / `moderator` / `member`) — moderasi konten publik.
- **`pengurus.divisi`** (`ketua`, `wakil`, `sekretaris`, `bendahara`, `media`,
  `pendidikan`, `acara`) — akses ruang kerja internal.

Awalnya tiap divisi hanya boleh menulis di areanya sendiri. Atas keputusan
komunitas, aturan itu dilonggarkan (migrasi `0009`): **setiap pengurus aktif
boleh menulis di area mana pun**, supaya saat seseorang sibuk atau sedang tidak
aktif, pengurus lain bisa menggantikan. Yang menjaga akuntabilitas bukan lagi
pembatasan, melainkan jejak audit (`log_audit`) plus penulis yang tercatat di
tiap baris.

Yang **tetap** dibatasi:

- Anggota biasa tidak bisa menyentuh data pengurus sama sekali.
- Peran dan verifikasi anggota hanya bisa diubah admin (trigger
  `profiles_guard_privileges`).
- Pengajuan **UJC Peduli** hanya terbaca ketua, wakil, dan bendahara — isinya
  penyakit, musibah, dan kesulitan ekonomi, beda sifat dari kas atau kalender.

Helper policy: `is_admin()`, `is_moderator()`, `is_pengurus()`,
`has_divisi(...)`, `is_pimpinan()`, `can_manage_pengurus_area()`.

Admin pertama diset lewat SQL:

```sql
update profiles set role = 'admin' where id = '<user-uuid>';
```

## Modul

Forum (thread bertingkat, vote, moderasi otomatis) · Kegiatan + RSVP ·
Resource · Marketplace (jual-beli, lelang dengan countdown, barang gratis) ·
Latihan CBT (JLPT/SSW, timer, penilaian di server) · Papan lowongan ·
Mentorship Senpai-Kouhai · UJC Peduli · Blog · Pesan langsung · Direktori
anggota · Peta sebaran · Struktur organisasi · Galeri · Notifikasi ·
Panel admin · Dashboard pengurus 12 panel · PWA offline

## Catatan implementasi

Beberapa keputusan yang tidak terlihat dari kode, beserta alasannya.

**Aturan bisnis hidup di database, bukan di server action.** Tabel bisa
dijangkau langsung lewat PostgREST dengan token anggota mana pun, jadi aturan
yang hanya ditulis di server action tidak berarti apa-apa. Lelang (`0012`),
mentorship (`0015`), publikasi artikel (`0017`), dan pemberian poin (`0020`)
semuanya ditegakkan trigger.

**Angka publik yang barisnya privat harus didenormalisasi.**
`events.going_count`, `peduli_cases.collected_amount`, dan
`mentors.active_mentees` disimpan sebagai kolom yang dijaga trigger.
Menghitungnya saat render selalu menghasilkan nol, karena RLS menyembunyikan
baris sumbernya dari pengunjung biasa.

**Kunci jawaban CBT tidak pernah meninggalkan database.** Soal dikirim tanpa
`correct_answer`, penilaian terjadi di dalam Postgres, dan kunci baru dibuka
untuk percobaan yang sudah dikumpulkan (`0013`).

**Peta hanya menampilkan agregat.** Koordinat anggota tidak pernah dikirim ke
klien; peta menggambar titik pusat prefektur yang dibawa aplikasi sendiri
(`0018`).

**Hasil server action jangan ditangani lewat `useEffect`.** Efek yang
bergantung pada `state.success` tidak berjalan lagi bila pesan suksesnya sama
persis, sehingga submit kedua tidak mereset form.

**`loading.tsx` mengubah status 404 jadi 200.** Streaming mengirim header
sebelum `notFound()` sempat jalan. Karena `loading.tsx` juga berlaku untuk
segment anak, skeleton daftar ditaruh di route group `(index)`.

**Realtime butuh `realtime.setAuth(token)`.** Tanpa token pengguna, Realtime
tidak punya identitas untuk mengevaluasi RLS dan diam-diam tidak mengirim apa
pun — terlihat seperti RLS bekerja, padahal pengirimannya yang mati.

## Pengujian

Tiap modul diverifikasi terhadap instance Supabase lokal yang sungguhan, bukan
diasumsikan dari kode yang berhasil di-build. Pendekatan itu memunculkan 14 bug
yang lolos `build`, `lint`, dan `tsc` tapi gagal terhadap data nyata — antara
lain `GRANT` tabel yang tidak pernah diberikan (seluruh query gagal), policy
insert yang membiarkan anggota melewati moderasi, papan internal yang bisa
dimasuki anggota mana pun, dan notifikasi yang selalu ditolak sehingga tidak
pernah ada satu pun yang dibuat.

## Belum dikerjakan

Web Push · i18n Bahasa Jepang · badge & pencapaian · unggah dokumen di panel
Administrasi · pembersihan berkas lama di Storage saat gambar diganti ·
penutupan lelang otomatis · notifikasi email

## Lisensi

[MIT](LICENSE) © 2026 UNSIA Japan Community.
