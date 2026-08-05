# Deploy ke produksi

Urutannya penting: **Supabase dulu, Vercel belakangan.** Build Vercel akan gagal
tanpa kredensial Supabase — bukan deploy setengah jalan, tapi berhenti di
validasi environment. Itu disengaja: lebih baik gagal saat build daripada situs
rusak yang sudah online.

---

## 1. Buat project Supabase

Di [supabase.com](https://supabase.com) → **New project**.

| Isian | Saran |
| --- | --- |
| Region | **Northeast Asia (Tokyo)** — anggota ada di Jepang, ini yang paling dekat |
| Database password | Simpan baik-baik, dibutuhkan di langkah 2 |

---

## 2. Jalankan migrasi

Ada **25 migrasi** yang harus dijalankan **berurutan**. Jangan tempel satu per
satu ke SQL Editor — 25 berkas terlalu mudah tertukar urutannya, dan urutannya
mengikat (migrasi belakangan mengubah tabel dan policy yang dibuat sebelumnya).

Dari folder project, di terminal:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # ref ada di URL dashboard
npx supabase db push
```

`db push` menjalankan `supabase/migrations/` berurutan dari 0001 sampai 0025.

> ⚠️ **`supabase/seed.sql` tidak boleh masuk produksi.** Isinya empat akun uji
> dengan kata sandi `password123`, salah satunya **admin**. `db push` tidak
> menjalankan seed (seed hanya jalan pada `db reset` lokal), jadi selama Anda
> memakai `db push` Anda aman — tapi jangan pernah menempelkan isi `seed.sql`
> ke SQL Editor produksi.

Bucket Storage (`avatars`, `gallery`, `documents`, dll.) dibuat otomatis oleh
migrasi `0019` — tidak perlu dibuat manual.

**Cek berhasil:** di dashboard → Table Editor harusnya ada ~60 tabel, dan
Storage → Buckets berisi 5 bucket.

---

## 3. Ambil kredensial

Dashboard → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`service_role` key **tidak dibutuhkan** aplikasi ini. Jangan pasang di Vercel
kalau tidak perlu — kunci itu melewati semua RLS.

---

## 4. Impor ke Vercel

[vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pilih
`UJC-2026/ujc-web`.

Framework terdeteksi otomatis (Next.js). Sebelum menekan Deploy, isi
**Environment Variables**:

| Nama | Nilai |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | dari langkah 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dari langkah 3 |
| `NEXT_PUBLIC_SITE_URL` | `https://<nama-project>.vercel.app` |
| `ANTHROPIC_API_KEY` | opsional — hanya untuk `/assistant` |

`NEXT_PUBLIC_SITE_URL` dipakai untuk tautan verifikasi email dan callback
OAuth. Kalau salah, pendaftaran akan mengarahkan orang ke `localhost`.

Deploy pertama akan gagal kalau ketiga variabel wajib belum diisi — itu wajar.

---

## 5. Setel URL redirect di Supabase

**Ini yang paling sering terlewat, dan gejalanya membingungkan:** pendaftaran
tampak berhasil, tapi tautan verifikasi di email mengarah ke `localhost`.

Dashboard Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<nama-project>.vercel.app`
- **Redirect URLs**, tambahkan:
  - `https://<nama-project>.vercel.app/auth/callback`
  - `https://<nama-project>-*.vercel.app/auth/callback` (untuk URL preview)

Kalau nanti pakai domain sendiri, tambahkan juga domain itu — di sini **dan**
di `NEXT_PUBLIC_SITE_URL` pada Vercel.

### Google OAuth (opsional)

Authentication → Providers → Google. Callback URL yang didaftarkan di Google
Cloud Console adalah milik **Supabase**, bukan Vercel:
`https://<project-ref>.supabase.co/auth/v1/callback`.

---

## 6. Buat admin pertama

Peran tidak bisa diubah sendiri oleh pengguna — dijaga trigger
`profiles_guard_privileges`. Jadi admin pertama harus lewat SQL.

Daftar dulu lewat website seperti anggota biasa, lalu di SQL Editor:

```sql
update profiles set role = 'admin', is_verified = true
where id = (select id from auth.users where email = 'email-anda@contoh.com');
```

Setelah itu semua verifikasi anggota dan pengangkatan pengurus bisa dilakukan
dari `/admin`.

---

## 7. Periksa hasilnya

| Cek | Harapan |
| --- | --- |
| Beranda terbuka | Statistik tampil (angka nol itu wajar di awal) |
| Daftar akun baru | Email verifikasi masuk, tautannya ke domain Vercel — **bukan** localhost |
| Unggah foto profil | Gambar tampil (membuktikan Storage + `next/image` benar) |
| Buka `/forum` | Halaman muncul walau masih kosong |
| `/robots.txt` dan `/sitemap.xml` | Terbuka, dan sitemap memuat domain produksi |

Kalau gambar tidak muncul, penyebabnya hampir selalu `NEXT_PUBLIC_SUPABASE_URL`
salah — `remotePatterns` di `next.config.ts` diturunkan dari variabel itu.

---

## Setelah deploy

Setiap `git push` ke `main` otomatis deploy ulang. Setiap pull request dapat URL
preview sendiri.

**Migrasi tidak ikut otomatis.** Kalau menambah berkas di
`supabase/migrations/`, jalankan `npx supabase db push` secara terpisah —
kalau tidak, kode baru akan berjalan di atas skema lama.

### Menjadwalkan penutupan lelang (opsional)

Lelang yang lewat batas waktu ditutup oleh `close_due_auctions()` (migrasi
`0029`), dan halaman marketplace sudah memanggilnya setiap kali dibuka. Jadi
hasilnya selalu benar untuk siapa pun yang melihat — **tanpa perlu setelan
apa pun**. Yang belum tepat waktu hanyalah notifikasinya: kalau berhari-hari
tidak ada yang membuka marketplace, pemenang baru diberi tahu saat kunjungan
berikutnya.

Kalau project Supabase-mu punya `pg_cron`, jadwalkan supaya penutupannya
tepat waktu. Jalankan sekali di SQL Editor:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'tutup-lelang-jatuh-tempo',
  '*/5 * * * *',
  $$select close_due_auctions()$$
);
```

`pg_cron` sengaja tidak diaktifkan lewat migrasi: tidak semua paket Supabase
mengizinkannya, dan `create extension` yang ditolak akan menggagalkan migrasi
sehingga seluruh deploy berikutnya ikut terhenti — harga yang terlalu mahal
untuk sesuatu yang sifatnya penyempurnaan.
