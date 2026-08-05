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
Mentorship Senpai-Kouhai · UJC Peduli · Blog · Creative Hub · Workshop &
webinar · QR check-in & e-sertifikat · Direktori bisnis anggota · Asisten AI
(kuota harian) · Pencarian global (Ctrl+K) · Pesan langsung · Direktori
anggota · Peta sebaran · Struktur organisasi · Galeri · Notifikasi · Poin,
level & lencana · Ekspor & hapus data mandiri · Panel admin · Dashboard
pengurus 12 panel · PWA offline

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

**Creative Hub memakai kurasi tautan, bukan feed otomatis.** Feed YouTube,
Instagram, dan Facebook menuntut API key per platform beserta app review yang
tidak bisa diselesaikan dari sisi kode. Yang dikirim: anggota menempelkan
tautan, dan thumbnail YouTube ikut tampil karena disajikan publik per video id
(`0026`). Platform dan video id diturunkan trigger dari URL-nya, tidak pernah
dipercaya dari klien.

**Kolom rahasia tidak boleh menumpang di baris yang publik.**
`events.checkin_code` sempat ada sejak `0002`, padahal policy `event publik`
memberi `select` atas *seluruh kolom* ke siapa pun. Kode absensi yang bisa
dibaca semua orang bukan kode absensi. `0027` memindahkannya ke tabel
`event_checkin_codes` sendiri, bukan sekadar `revoke` per kolom — semua query
event memakai `select *`, jadi mencabut satu kolom malah membuat semuanya
gagal dengan "permission denied for column".

**`or is_pengurus()` di policy berarti query "milik saya" wajib difilter
sendiri.** Policy `event_checkins` dan `certificates` berbunyi
`user_id = auth.uid() or is_pengurus()`. Query tanpa `.eq("user_id", ...)`
karena mengira "RLS sudah menyaring" akan mengembalikan baris orang lain
begitu pembacanya pengurus — sempat membuat setiap pengurus dianggap sudah
hadir, lengkap dengan nomor sertifikat milik anggota lain. RLS di sini adalah
batas atas, bukan filter.

**Lencana diturunkan ulang, bukan dihitung maju.** `sync_badges()` (`0030`)
menanyakan "sekarang anggota ini berhak apa saja" lalu memasukkan yang belum
ada, sehingga aman dipanggil berapa kali pun — dan itu dipakai: pemicunya
digantung di `award_points()`, satu kait untuk semua kriteria, bukan trigger
per tabel yang harus diingat tiap kali sumber poin baru ditambahkan. Kriteria
ditulis sebagai SQL di dalam fungsi, bukan sebagai baris data: mesin aturan
berbasis data berarti menciptakan bahasa kecil beserta penafsirnya untuk
menyatakan selusin ambang yang sudah jelas sebagai `count(*) >= 10`. Tabel
katalognya hanya memuat tampilan — nama, deskripsi, ikon, tingkat.

**Lelang ditutup saat halaman dibuka, bukan oleh penjadwal.** Tidak ada
trigger yang menyala saat sebuah timestamp lewat, jadi harus ada yang
bertanya. `close_due_auctions()` (`0029`) bersifat idempoten dan tanpa
argumen, dan dipanggil dari query marketplace — hasilnya benar untuk siapa pun
yang melihat, di deployment mana pun, tanpa infrastruktur tambahan.
Penandanya `auction_closed_at`: itu yang membuat sepuluh kunjungan menutup
lelang sekali dan mengirim satu notifikasi. `pg_cron` sengaja tidak
diaktifkan lewat migrasi (`create extension` yang ditolak akan menggagalkan
seluruh deploy berikutnya) — cara menjadwalkannya ada di DEPLOYMENT.md, dan
efeknya hanya membuat penutupan tepat waktu, bukan membuatnya benar.

Notifikasinya ditulis langsung, bukan lewat `notify_user()`, yang berhenti
kalau targetnya sama dengan pemanggil. Aturan itu tepat untuk "si A membalas
threadmu" dan salah di sini: yang kunjungannya memicu penutupan biasanya
justru penawar — bisa jadi pemenangnya sendiri, satu-satunya orang yang malah
tidak akan diberi tahu.

**Hapus akun menyerahkan keputusannya ke foreign key, bukan ke kode.** Aturan
`on delete` sudah menyimpan kebijakan yang benar sejak `0001`: konten pribadi
(thread, artikel, barang, pesan) `cascade` dari `profiles`, sedangkan catatan
milik komunitas (donasi UJC Peduli, pembukuan, jejak audit, event yang pernah
ia panitiai) `set null` sehingga tetap ada tanpa tertaut namanya. `0028`
karena itu cukup menghapus satu baris di `auth.users`. Admin terakhir ditolak
— himpunan admin yang kosong mengunci seluruh alat pengurus dan tidak bisa
diperbaiki dari dalam aplikasi.

## Pengujian

Tiap modul diverifikasi terhadap instance Supabase lokal yang sungguhan, bukan
diasumsikan dari kode yang berhasil di-build. Pendekatan itu memunculkan 14 bug
yang lolos `build`, `lint`, dan `tsc` tapi gagal terhadap data nyata — antara
lain `GRANT` tabel yang tidak pernah diberikan (seluruh query gagal), policy
insert yang membiarkan anggota melewati moderasi, papan internal yang bisa
dimasuki anggota mana pun, dan notifikasi yang selalu ditolak sehingga tidak
pernah ada satu pun yang dibuat.

Verifikasi UI dijalankan terhadap `next build && next start`, bukan `next dev`.
Di mesin pengembangan yang dipakai, HMR WebSocket dev server gagal handshake
sehingga halaman tidak pernah ter-hydrate: setiap blok `Reveal` tersangkut di
`opacity: 0` dan Ctrl+K mati — mirip sekali dengan bug UI besar, padahal build
produksi normal sepenuhnya.

ID contoh di `seed.sql` memakai bentuk UUID v4 yang sah
(`…-4000-8000-…`), bukan `…-0000-0000-…` seperti sebelumnya. `z.uuid()` pada
Zod 4 memeriksa bit versi/varian sesuai RFC 9562, jadi ID lama ditolak setiap
server action yang memvalidasinya — RSVP dan absensi sama-sama gagal dengan
"Invalid UUID" hanya di lingkungan lokal, sementara data produksi yang lahir
dari `gen_random_uuid()` baik-baik saja. `instance_id` milik GoTrue tetap UUID
nol; itu memang harus begitu.

## Belum dikerjakan

Web Push · i18n Bahasa Jepang · unggah dokumen di panel Administrasi ·
pembersihan berkas lama di Storage saat gambar diganti · notifikasi email ·
section partner di beranda (tabel `partners` sudah ada, belum dipakai) ·
reminder akademik akhir pekan · feed otomatis media sosial (butuh API key +
app review tiap platform; Creative Hub memakai kurasi tautan sebagai
gantinya)

## Lisensi

[MIT](LICENSE) © 2026 UNSIA Japan Community.
