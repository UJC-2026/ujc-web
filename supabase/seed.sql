-- Baseline data so a fresh database is usable immediately.

insert into org_periods (year_label, is_active)
values ('2025/2026', true)
on conflict (year_label) do nothing;

insert into forum_categories (name, slug, description, icon, sort_order) values
  ('Akademik', 'akademik', 'Diskusi mata kuliah, tugas, dan e-link UNSIA.', 'graduation-cap', 1),
  ('Kehidupan di Jepang', 'kehidupan-di-jepang', 'Tempat tinggal, transportasi, kesehatan, dan keseharian.', 'home', 2),
  ('Lowongan Kerja', 'lowongan-kerja', 'Info dan pengalaman kerja di Jepang.', 'briefcase', 3),
  ('Tanya Jawab Visa', 'tanya-jawab-visa', 'Perpanjangan, perubahan status, dan urusan imigrasi.', 'file-text', 4),
  ('Diskusi Umum', 'diskusi-umum', 'Obrolan bebas antar anggota UJC.', 'message-circle', 5)
on conflict (slug) do nothing;

insert into cbt_test_categories (name, type, level, description, duration_minutes, is_published) values
  ('JLPT N5', 'jlpt', 'N5', 'Latihan dasar kosakata, tata bahasa, dan membaca.', 60, true),
  ('JLPT N4', 'jlpt', 'N4', 'Latihan tingkat dasar lanjutan.', 60, true),
  ('JLPT N3', 'jlpt', 'N3', 'Latihan tingkat menengah.', 70, true),
  ('JLPT N2', 'jlpt', 'N2', 'Latihan tingkat menengah atas.', 80, true),
  ('SSW Kaigo', 'ssw', 'Kaigo', 'Latihan tes keterampilan bidang perawatan.', 60, true),
  ('SSW Gaishoku', 'ssw', 'Gaishoku', 'Latihan tes keterampilan bidang restoran.', 60, true);

-- ---------------------------------------------------------------------------
-- Demo content for local development only.
-- Every seeded account uses the password "password123".
-- ---------------------------------------------------------------------------

-- GoTrue scans the token columns into non-nullable Go strings, so they must be
-- '' rather than NULL or every sign-in fails with "Database error querying
-- schema". Hand-written auth.users rows have to set them explicitly.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current
)
select
  v.id::uuid, v.instance_id::uuid, v.aud, v.role, v.email, v.encrypted_password,
  v.email_confirmed_at, v.created_at, v.updated_at,
  v.raw_app_meta_data::jsonb, v.raw_user_meta_data::jsonb,
  '', '', '', '', ''
from (values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@ujc.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Rina Hartono"}'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'moderator@ujc.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Dimas Prakoso"}'),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member@ujc.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Siti Nurhaliza"}'),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'acara@ujc.test',
   crypt('password123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Bagus Setiawan"}')
) as v(
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
)
select u.id, u.id, u.id::text, 'email',
       format('{"sub":"%s","email":"%s"}', u.id, u.email)::jsonb, now(), now()
from auth.users u
on conflict do nothing;

insert into profiles (
  id, full_name, nim, kelas, city, prefecture, major, angkatan,
  role, is_verified, bio, motto, onboarded_at
)
values
  ('11111111-1111-4111-8111-111111111111', 'Rina Hartono', '210001', 'SI-21A',
   'Nagoya', 'Aichi', 'Sistem Informasi', '2021', 'admin', true,
   'Ketua UJC periode 2025/2026. Kerja di pabrik otomotif sambil kuliah daring.',
   'Sedikit demi sedikit, lama-lama jadi bukit.', now()),
  ('22222222-2222-4222-8222-222222222222', 'Dimas Prakoso', '210002', 'SI-21A',
   'Osaka', 'Osaka', 'Sistem Informasi', '2021', 'moderator', true,
   'Moderator forum. Sudah empat tahun tinggal di Kansai.',
   'Tanya dulu, malu kemudian.', now()),
  ('33333333-3333-4333-8333-333333333333', 'Siti Nurhaliza', '220015', 'MN-22B',
   'Hamamatsu', 'Shizuoka', 'Manajemen', '2022', 'member', true,
   'Anggota baru, masih belajar bahasa Jepang.', 'Ganbarimasu!', now()),
  ('44444444-4444-4444-8444-444444444444', 'Bagus Setiawan', '210044', 'SI-21B',
   'Tokyo', 'Tokyo', 'Sistem Informasi', '2021', 'member', true,
   'Divisi Kegiatan. Suka bikin kopdar.', 'Kumpul dulu, urusan belakangan.', now())
-- The on_auth_user_created trigger already inserted a bare profile for each
-- account above, so this has to update rather than skip — otherwise role,
-- city, and is_verified silently keep their defaults.
on conflict (id) do update set
  full_name = excluded.full_name,
  nim = excluded.nim,
  kelas = excluded.kelas,
  city = excluded.city,
  prefecture = excluded.prefecture,
  major = excluded.major,
  angkatan = excluded.angkatan,
  bio = excluded.bio,
  motto = excluded.motto,
  onboarded_at = excluded.onboarded_at;

-- role and is_verified are deliberately left out of the upsert above: the
-- profiles_guard_privileges trigger reverts both unless the caller is an
-- admin, and a seed run has no session to be one. That guard is doing its
-- job, so the seed steps around it explicitly rather than weakening it.
alter table profiles disable trigger profiles_guard_privileges;

update profiles set role = 'admin', is_verified = true
  where id = '11111111-1111-4111-8111-111111111111';
update profiles set role = 'moderator', is_verified = true
  where id = '22222222-2222-4222-8222-222222222222';
update profiles set is_verified = true
  where id in ('33333333-3333-4333-8333-333333333333',
               '44444444-4444-4444-8444-444444444444');

alter table profiles enable trigger profiles_guard_privileges;

insert into pengurus (user_id, divisi, period_id, is_active)
select v.user_id, v.divisi, o.id, true
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'ketua'::divisi),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'pendidikan'::divisi),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'acara'::divisi)
) as v(user_id, divisi)
cross join (select id from org_periods where is_active limit 1) o
on conflict do nothing;

insert into forum_threads (
  id, category_id, author_id, title, content, tags, is_pinned, view_count
)
select v.id, c.id, v.author_id, v.title, v.content, v.tags, v.is_pinned, v.views
from (values
  ('70000000-0000-4000-8000-000000000001'::uuid, 'tanya-jawab-visa',
   '22222222-2222-4222-8222-222222222222'::uuid,
   'Panduan lengkap perpanjang visa student sambil kerja part-time',
   '<p>Ringkasan pengalaman saya perpanjang visa di <strong>Osaka Immigration</strong>.</p><h2>Dokumen yang disiapkan</h2><ul><li>Paspor dan zairyu card</li><li>Surat keterangan mahasiswa dari UNSIA</li><li>Bukti saldo rekening</li></ul><p>Prosesnya sekitar dua minggu. Kalau ada yang mau tanya, silakan balas di bawah.</p>',
   array['visa','imigrasi','panduan'], true, 342),
  ('70000000-0000-4000-8000-000000000002'::uuid, 'akademik',
   '33333333-3333-4333-8333-333333333333'::uuid,
   'Cara atur waktu belajar e-link kalau shift kerja malam?',
   '<p>Saya kerja shift malam dan sering ketinggalan deadline tugas di e-link. Ada yang punya tips atur jadwal belajar?</p>',
   array['kuliah','tips'], false, 128),
  ('70000000-0000-4000-8000-000000000003'::uuid, 'kehidupan-di-jepang',
   '44444444-4444-4444-8444-444444444444'::uuid,
   'Rekomendasi apartemen murah area Tokyo untuk pekerja',
   '<p>Sharing beberapa area yang sewanya masih masuk akal buat yang kerja di Tokyo.</p><blockquote>Budget di bawah 60.000 yen masih mungkin kalau mau agak jauh dari pusat.</blockquote>',
   array['tempat-tinggal','tokyo'], false, 89),
  ('70000000-0000-4000-8000-000000000004'::uuid, 'lowongan-kerja',
   '11111111-1111-4111-8111-111111111111'::uuid,
   'Pengalaman pindah dari pabrik ke kerja kantoran (SSW ke Gijutsu)',
   '<p>Butuh waktu setahun, tapi akhirnya berhasil ganti status visa. Ini tahapannya.</p>',
   array['kerja','visa','ssw'], false, 210),
  ('70000000-0000-4000-8000-000000000005'::uuid, 'akademik',
   '33333333-3333-4333-8333-333333333333'::uuid,
   'Ada yang sudah ambil mata kuliah Basis Data semester ini?',
   '<p>Mau tanya soal tugas besarnya, apakah berkelompok atau individu?</p>',
   array['kuliah'], false, 34)
) as v(id, slug, author_id, title, content, tags, is_pinned, views)
join forum_categories c on c.slug = v.slug
on conflict (id) do nothing;

insert into forum_replies (id, thread_id, author_id, parent_reply_id, content)
values
  ('80000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333', null,
   '<p>Terima kasih banyak, ini sangat membantu. Kalau zairyu card-nya habis bulan depan, apakah masih sempat?</p>'),
  ('80000000-0000-4000-8000-000000000002',
   '70000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222',
   '80000000-0000-4000-8000-000000000001',
   '<p>Masih sempat kok. Idealnya urus dua sampai tiga bulan sebelum expired, tapi satu bulan pun biasanya masih diproses.</p>'),
  ('80000000-0000-4000-8000-000000000003',
   '70000000-0000-4000-8000-000000000001',
   '44444444-4444-4444-8444-444444444444', null,
   '<p>Nambahin: bawa fotokopi semua dokumen, petugasnya sering minta salinan.</p>'),
  ('80000000-0000-4000-8000-000000000004',
   '70000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111', null,
   '<p>Saya biasanya blok dua jam sebelum berangkat kerja. Konsisten tiap hari lebih ampuh daripada maraton di akhir pekan.</p>'),
  ('80000000-0000-4000-8000-000000000005',
   '70000000-0000-4000-8000-000000000002',
   '22222222-2222-4222-8222-222222222222',
   '80000000-0000-4000-8000-000000000004',
   '<p>Setuju. Dan pasang reminder di HP buat deadline e-link, jangan andalkan ingatan.</p>')
on conflict (id) do nothing;

-- Exercises the score trigger added in 0005.
insert into forum_votes (user_id, thread_id, vote)
values
  ('33333333-3333-4333-8333-333333333333', '70000000-0000-4000-8000-000000000001', 'up'),
  ('44444444-4444-4444-8444-444444444444', '70000000-0000-4000-8000-000000000001', 'up'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000001', 'up'),
  ('11111111-1111-4111-8111-111111111111', '70000000-0000-4000-8000-000000000003', 'up'),
  ('33333333-3333-4333-8333-333333333333', '70000000-0000-4000-8000-000000000004', 'up')
on conflict do nothing;

insert into forum_votes (user_id, reply_id, vote)
values
  ('33333333-3333-4333-8333-333333333333', '80000000-0000-4000-8000-000000000002', 'up'),
  ('11111111-1111-4111-8111-111111111111', '80000000-0000-4000-8000-000000000002', 'up'),
  ('44444444-4444-4444-8444-444444444444', '80000000-0000-4000-8000-000000000004', 'up')
on conflict do nothing;

insert into events (
  id, title, description, location, prefecture, event_date,
  is_online, meeting_link, capacity, created_by
)
values
  ('e0000000-0000-4000-8000-000000000001',
   'Kopdar UJC Kanto — Musim Panas',
   E'Kumpul santai anggota UJC area Kanto.\n\nAgenda: perkenalan anggota baru, sharing pengalaman kerja, dan makan bersama.',
   'Taman Ueno, Tokyo', 'Tokyo', now() + interval '14 days',
   false, null, 40, '44444444-4444-4444-8444-444444444444'),
  ('e0000000-0000-4000-8000-000000000002',
   'Webinar: Persiapan JLPT N3 dalam 3 Bulan',
   E'Strategi belajar JLPT N3 untuk yang kerja penuh waktu.\n\nPembicara: alumni UJC yang lulus N2 sambil kerja shift.',
   null, null, now() + interval '5 days',
   true, 'https://meet.google.com/ujc-jlpt-n3', 100,
   '22222222-2222-4222-8222-222222222222'),
  ('e0000000-0000-4000-8000-000000000003',
   'Workshop Menulis CV Bahasa Jepang (Rirekisho)',
   'Praktik langsung menulis rirekisho dan shokumu keirekisho yang benar.',
   'Balai Warga Sakae, Nagoya', 'Aichi', now() + interval '25 days',
   false, null, 2, '11111111-1111-4111-8111-111111111111'),
  ('e0000000-0000-4000-8000-000000000004',
   'Halal Bihalal UJC',
   'Silaturahmi anggota UJC se-Jepang secara daring.',
   null, null, now() - interval '45 days',
   true, 'https://meet.google.com/ujc-halal-bihalal', null,
   '11111111-1111-4111-8111-111111111111'),
  ('e0000000-0000-4000-8000-000000000005',
   'Sharing Session: Kerja di Sektor Kaigo',
   'Cerita anggota yang bekerja di bidang perawatan lansia.',
   'Online', null, now() - interval '10 days',
   true, 'https://meet.google.com/ujc-kaigo', 60,
   '44444444-4444-4444-8444-444444444444')
on conflict (id) do nothing;

-- Event 3 has capacity 2 and two "hadir" RSVPs, so it renders as full.
insert into event_rsvp (event_id, user_id, status)
values
  ('e0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'hadir'),
  ('e0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'hadir'),
  ('e0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'mungkin'),
  ('e0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', 'hadir'),
  ('e0000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'hadir'),
  ('e0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'tidak'),
  ('e0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'hadir'),
  ('e0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'hadir'),
  ('e0000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'hadir')
on conflict (event_id, user_id) do nothing;

insert into resources (title, category, description, link, file_url, uploaded_by)
values
  ('Panduan Perpanjangan Visa Student', 'Visa',
   'Langkah demi langkah beserta daftar dokumen yang perlu disiapkan.',
   'https://www.isa.go.jp/en/', null, '22222222-2222-4222-8222-222222222222'),
  ('Template Rirekisho (CV Jepang)', 'Karier',
   'Berkas siap isi dengan format standar perusahaan Jepang.',
   null, 'https://example.com/rirekisho-template.pdf',
   '22222222-2222-4222-8222-222222222222'),
  ('Kalender Akademik UNSIA', 'Akademik',
   'Jadwal semester, UTS, UAS, dan batas pengisian KRS.',
   'https://unsia.ac.id', null, '11111111-1111-4111-8111-111111111111'),
  ('Daftar Kosakata JLPT N4', 'Bahasa',
   'Kumpulan kosakata inti N4 lengkap dengan contoh kalimat.',
   null, 'https://example.com/n4-vocab.pdf',
   '22222222-2222-4222-8222-222222222222'),
  ('Tips Aman Kerja di Pabrik', 'Karier',
   'Istilah keselamatan kerja yang wajib dipahami di genba.',
   null, 'https://example.com/safety.pdf',
   '44444444-4444-4444-8444-444444444444'),
  ('Cara Daftar Asuransi Kesehatan (Kokumin Kenko Hoken)', 'Kehidupan',
   'Prosedur pendaftaran di kantor kota beserta perkiraan biaya.',
   'https://www.mhlw.go.jp/', null, '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into partners (name, website_url, description, sort_order)
values
  ('Universitas Siber Asia', 'https://unsia.ac.id', 'Kampus asal anggota UJC.', 1),
  ('PPI Jepang', 'https://ppijepang.org', 'Perhimpunan Pelajar Indonesia di Jepang.', 2),
  ('KBRI Tokyo', 'https://kemlu.go.id/tokyo', 'Perwakilan Republik Indonesia di Jepang.', 3)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- pengurus workspace: proker, tugas, kas
-- ---------------------------------------------------------------------------

insert into programs (id, divisi, title, description, target, start_date, end_date, pic_id, budget, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'acara',
   'Kopdar rutin tiap prefektur', 'Kopdar bergilir di Kanto, Chubu, dan Kansai.',
   'Minimal 6 kopdar dalam setahun', current_date - 60, current_date + 3,
   '44444444-4444-4444-8444-444444444444', 120000, 'berjalan'),
  ('a1000000-0000-4000-8000-000000000002', 'pendidikan',
   'Bank soal JLPT N4 & N3', 'Menyusun 500 soal latihan beserta pembahasan.',
   '500 soal terbit', current_date - 90, current_date + 20,
   '22222222-2222-4222-8222-222222222222', 50000, 'berjalan'),
  ('a1000000-0000-4000-8000-000000000003', 'media',
   'Kalender konten media sosial', 'Posting rutin 3x seminggu di Instagram.',
   'Engagement naik 30%', current_date - 30, current_date + 90,
   '11111111-1111-4111-8111-111111111111', 30000, 'rencana'),
  ('a1000000-0000-4000-8000-000000000004', 'acara',
   'Webinar karier bidang kaigo', 'Menghadirkan alumni yang bekerja di kaigo.',
   '100 peserta', current_date - 120, current_date - 30,
   '44444444-4444-4444-8444-444444444444', 25000, 'selesai'),
  ('a1000000-0000-4000-8000-000000000005', 'bendahara',
   'Digitalisasi laporan kas', 'Pindah pencatatan kas ke sistem website.',
   'Laporan bulanan otomatis', current_date - 45, current_date - 5,
   '11111111-1111-4111-8111-111111111111', null, 'tertunda')
on conflict (id) do nothing;

insert into tasks (program_id, title, description, assigned_to, created_by, due_date, priority, status)
values
  ('a1000000-0000-4000-8000-000000000001', 'Booking tempat kopdar Kanto',
   'Konfirmasi kapasitas dan biaya sewa.',
   '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
   current_date + 2, 'tinggi', 'dikerjakan'),
  ('a1000000-0000-4000-8000-000000000001', 'Desain poster kopdar',
   'Ukuran feed dan story Instagram.',
   '11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
   current_date - 1, 'tinggi', 'todo'),
  ('a1000000-0000-4000-8000-000000000002', 'Review 100 soal N4',
   'Cek kunci jawaban dan pembahasan.',
   '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
   current_date + 6, 'sedang', 'dikerjakan'),
  ('a1000000-0000-4000-8000-000000000003', 'Susun draf kalender konten',
   null, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   current_date + 30, 'rendah', 'todo'),
  ('a1000000-0000-4000-8000-000000000004', 'Kirim e-sertifikat peserta webinar',
   null, '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
   current_date - 25, 'sedang', 'selesai')
on conflict do nothing;

insert into finance_transactions (type, category, amount, description, recorded_by, occurred_on)
values
  ('pemasukan', 'Iuran anggota', 84000, 'Iuran anggota triwulan I',
   '11111111-1111-4111-8111-111111111111', current_date - 40),
  ('pemasukan', 'Donasi', 50000, 'Donasi alumni untuk UJC Peduli',
   '11111111-1111-4111-8111-111111111111', current_date - 22),
  ('pengeluaran', 'Kegiatan', 32000, 'Sewa tempat kopdar Chubu',
   '11111111-1111-4111-8111-111111111111', current_date - 18),
  ('pengeluaran', 'Operasional', 12000, 'Langganan alat desain',
   '11111111-1111-4111-8111-111111111111', current_date - 9),
  ('pengeluaran', 'Kegiatan', 18000, 'Konsumsi webinar kaigo',
   '11111111-1111-4111-8111-111111111111', current_date - 4)
on conflict do nothing;

insert into meeting_notes (title, content, meeting_date, created_by)
values
  ('Rapat koordinasi kopdar Kanto',
   E'Pembahasan:\n1. Lokasi disepakati Taman Ueno.\n2. Anggaran konsumsi ¥32.000.\n3. Poster selesai H-7.\n\nTindak lanjut: Bagus booking tempat, Rina siapkan poster.',
   current_date - 12, '11111111-1111-4111-8111-111111111111'),
  ('Evaluasi webinar kaigo',
   E'Hadir 68 dari 100 kuota. Feedback positif soal narasumber.\nCatatan: rekaman perlu diunggah maksimal 3 hari setelah acara.',
   current_date - 32, '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into documents (title, category, file_url, uploaded_by)
values
  ('AD/ART UJC 2025', 'Legal', 'https://example.com/adart-ujc.pdf',
   '11111111-1111-4111-8111-111111111111'),
  ('Template surat undangan rapat', 'Template',
   'https://example.com/template-undangan.docx',
   '11111111-1111-4111-8111-111111111111'),
  ('Laporan kegiatan semester I', 'Laporan',
   'https://example.com/laporan-semester-1.pdf',
   '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into content_calendar (title, type, scheduled_at, status, assigned_to)
values
  ('Reels dokumentasi kopdar Kanto', 'Instagram',
   now() + interval '6 days', 'rencana', '11111111-1111-4111-8111-111111111111'),
  ('Poster pendaftaran webinar JLPT', 'Instagram',
   now() + interval '2 days', 'proses', '11111111-1111-4111-8111-111111111111'),
  ('Rekap kegiatan bulan lalu', 'YouTube',
   now() - interval '5 days', 'terbit', '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into announcements (title, content, channel, sent_by, sent_at)
values
  ('Pendaftaran kopdar Kanto dibuka',
   'Anggota area Kanto bisa mendaftar lewat halaman kegiatan sampai kuota penuh.',
   '["inapp","email"]'::jsonb, '11111111-1111-4111-8111-111111111111',
   now() - interval '3 days'),
  ('Pengingat pengisian KRS',
   'Batas pengisian KRS semester ini tinggal seminggu lagi. Cek e-link masing-masing.',
   '["inapp"]'::jsonb, '11111111-1111-4111-8111-111111111111', null)
on conflict do nothing;

-- A few CBT questions so the akademik panel shows a non-empty bank.
insert into cbt_questions (category_id, question, options, correct_answer, explanation, sort_order)
select c.id, v.question, v.options::jsonb, v.answer, v.explanation, v.ord
from (values
  ('JLPT N5', 'これは　だれの　かばんですか。', '["わたし","わたしの","わたしは","わたしを"]', 'わたしの',
   'Kepemilikan ditandai partikel の setelah kata ganti.', 1),
  ('JLPT N5', 'まいあさ　コーヒーを　＿＿＿。', '["のみます","たべます","みます","ききます"]', 'のみます',
   'Untuk minuman dipakai kata kerja のむ.', 2),
  ('JLPT N4', 'あした　あめが　ふる＿＿＿しれません。', '["かも","でも","ても","のに"]', 'かも',
   'かもしれません berarti "mungkin".', 1),
  ('SSW Kaigo', 'Apa langkah pertama sebelum membantu lansia berpindah posisi?',
   '["Langsung mengangkat","Menjelaskan dan meminta izin","Memanggil keluarga","Mencatat di buku"]',
   'Menjelaskan dan meminta izin',
   'Komunikasi dan persetujuan adalah prosedur wajib sebelum tindakan.', 1)
) as v(cat, question, options, answer, explanation, ord)
join cbt_test_categories c on c.name = v.cat
on conflict do nothing;

insert into internal_board (id, author_id, title, content, is_pinned)
values
  ('b1000000-0000-4000-8000-000000000001',
   '44444444-4444-4444-8444-444444444444',
   'Butuh bantuan desain poster kopdar Kanto',
   E'Tenggat poster lusa tapi aku belum sempat karena shift malam sampai akhir pekan.\n\nAda yang bisa bantu? Materinya sudah siap, tinggal layout.',
   true),
  ('b1000000-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Pengingat: laporan kas triwulan',
   'Mohon semua divisi kirim nota pengeluaran sebelum akhir bulan supaya rekap kas bisa ditutup.',
   false)
on conflict (id) do nothing;

insert into internal_board_replies (board_id, author_id, content)
values
  ('b1000000-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Aku bisa ambil layout-nya malam ini. Kirim materinya ke DM ya.'),
  ('b1000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222',
   'Kalau butuh proofread teks Jepangnya, aku bisa bantu.')
on conflict do nothing;

insert into internal_calendar (title, type, start_at, created_by)
values
  ('Rapat pleno pengurus', 'rapat', now() + interval '4 days',
   '11111111-1111-4111-8111-111111111111'),
  ('Batas kirim nota pengeluaran', 'deadline', now() + interval '9 days',
   '11111111-1111-4111-8111-111111111111'),
  ('Ulang tahun UJC', 'penting', now() + interval '18 days',
   '11111111-1111-4111-8111-111111111111')
on conflict do nothing;

insert into peduli_cases (id, title, description, category, target_amount, status, is_public, submitted_by, verified_by)
values
  ('d1000000-0000-4000-8000-000000000001',
   'Biaya pengobatan setelah kecelakaan kerja',
   E'Anggota kami mengalami kecelakaan di tempat kerja dan harus menjalani operasi. Asuransi menanggung sebagian, sisanya cukup memberatkan karena ia juga mengirim uang ke keluarga di Indonesia.\n\nBantuan akan langsung disalurkan ke biaya rumah sakit.',
   'Kesehatan', 250000, 'berjalan', true,
   '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111'),
  ('d1000000-0000-4000-8000-000000000002',
   'Bantuan kepulangan darurat karena duka keluarga',
   'Salah satu anggota harus pulang mendadak karena orang tuanya meninggal. Tiket mendadak harganya jauh di atas biasanya.',
   'Musibah', 120000, 'selesai', true,
   '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111'),
  -- Deliberately left unverified: exercises the privacy path.
  ('d1000000-0000-4000-8000-000000000003',
   'Kesulitan biaya hidup setelah kontrak kerja berakhir',
   'Kontrak berakhir mendadak dan belum dapat pekerjaan pengganti. Butuh bantuan sementara untuk sewa apartemen.',
   'Ekonomi', 80000, 'pengajuan', false,
   '33333333-3333-4333-8333-333333333333', null)
on conflict (id) do nothing;

insert into peduli_donations (case_id, donor_id, amount, is_anonymous, message)
values
  ('d1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   50000, false, 'Semoga lekas pulih ya. Kami semua mendoakan.'),
  ('d1000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   30000, true, 'Semoga membantu.'),
  ('d1000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444',
   25000, false, null),
  ('d1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   70000, false, 'Turut berduka cita.'),
  ('d1000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   50000, true, null)
on conflict do nothing;

insert into marketplace_items (id, seller_id, title, description, category, condition, price, is_giveaway, is_auction, auction_end_at, city, prefecture, status)
values
  ('f1000000-0000-4000-8000-000000000001',
   '44444444-4444-4444-8444-444444444444',
   'Sepeda mamachari, ban baru diganti',
   E'Dipakai 2 tahun untuk pulang pergi kerja. Ban depan-belakang baru diganti bulan lalu, rem masih pakem.\n\nDijual karena mau pindah ke Osaka.',
   'Sepeda', 'Bekas - mulus', 8000, false, false, null,
   'Tokyo', 'Tokyo', 'tersedia'),
  ('f1000000-0000-4000-8000-000000000002',
   '33333333-3333-4333-8333-333333333333',
   'Rice cooker Zojirushi 5.5 gou',
   'Masih berfungsi normal, lengkap dengan buku manual. Dilelang karena mau pulang ke Indonesia bulan depan.',
   'Peralatan dapur', 'Bekas - layak pakai', 3000, false, true,
   now() + interval '5 days', 'Hamamatsu', 'Shizuoka', 'tersedia'),
  ('f1000000-0000-4000-8000-000000000003',
   '11111111-1111-4111-8111-111111111111',
   'Meja belajar lipat, ambil sendiri',
   'Gratis untuk yang mau ambil sendiri di Nagoya. Kondisi masih kokoh, cuma ada baret di permukaan.',
   'Furnitur', 'Bekas - layak pakai', null, true, false, null,
   'Nagoya', 'Aichi', 'tersedia'),
  ('f1000000-0000-4000-8000-000000000004',
   '22222222-2222-4222-8222-222222222222',
   'Kamus elektronik Casio EX-word',
   'Sudah terjual, diarsipkan sebagai contoh riwayat.',
   'Elektronik', 'Bekas - mulus', 12000, false, false, null,
   'Osaka', 'Osaka', 'terjual')
on conflict (id) do nothing;

insert into marketplace_bids (item_id, bidder_id, amount)
values
  ('f1000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 3000),
  ('f1000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 3500)
on conflict do nothing;

insert into jobs (id, title, company, location_prefecture, salary_min, salary_max, contract_type, visa_types, deadline, description, requirements, posted_by, is_verified)
values
  ('a2000000-0000-4000-8000-000000000001',
   'Operator produksi shift malam', 'Kabushiki Kaisha Tsubaki Seiko',
   'Aichi', 210000, 260000, 'Keiyaku shain',
   '["SSW (Tokutei Ginou)","Ginou Jisshu"]'::jsonb,
   current_date + 21,
   E'Perakitan komponen otomotif di pabrik area Toyota.

Shift malam 22.00-07.00, lima hari kerja. Asrama perusahaan tersedia dengan potongan sewa.',
   E'- N4 atau setara
- Bersedia shift malam
- Pengalaman pabrik jadi nilai tambah',
   '11111111-1111-4111-8111-111111111111', true),
  ('a2000000-0000-4000-8000-000000000002',
   'Staf kaigo (perawatan lansia)', 'Shakai Fukushi Houjin Hikari',
   'Osaka', 230000, 280000, 'Seishain',
   '["SSW (Tokutei Ginou)"]'::jsonb,
   current_date + 35,
   'Panti wreda di Osaka membuka lowongan staf perawatan. Pelatihan awal disediakan.',
   E'- N3 diutamakan
- Sertifikat kaigo SSW
- Sabar dan telaten',
   '11111111-1111-4111-8111-111111111111', true),
  -- Deliberately left unverified: exercises the moderation gate.
  ('a2000000-0000-4000-8000-000000000003',
   'Penerjemah lepas ID-JP', 'PT Media Lintas Bahasa',
   'Tokyo', 1500, 3000, 'Baito / paruh waktu',
   '["Gijutsu / Jinbun Chishiki","Ryugaku (pelajar)"]'::jsonb,
   current_date + 14,
   'Penerjemahan dokumen dan pendampingan rapat daring. Bayaran per jam.',
   'N2 ke atas, terbiasa dengan istilah bisnis.',
   '44444444-4444-4444-8444-444444444444', false)
on conflict (id) do nothing;

insert into mentors (id, user_id, expertise, city, experience_summary, is_available, capacity)
values
  ('b2000000-0000-4000-8000-000000000001',
   '22222222-2222-4222-8222-222222222222',
   '["Urusan visa & imigrasi","Bahasa Jepang & JLPT"]'::jsonb,
   'Osaka',
   'Empat tahun di Kansai, pernah dua kali perpanjang visa student sambil kerja baito. Lulus N2 tahun lalu sambil kuliah daring.',
   true, 2),
  ('b2000000-0000-4000-8000-000000000002',
   '44444444-4444-4444-8444-444444444444',
   '["Adaptasi awal di Jepang","Cari kerja / pindah kerja"]'::jsonb,
   'Tokyo',
   'Datang 2021 lewat jalur SSW, sekarang di Tokyo. Pernah pindah kerja sekali dan ngurus sendiri semua dokumennya.',
   true, 3)
on conflict (id) do nothing;

insert into mentorship_requests (mentor_id, mentee_id, message, status)
values
  ('b2000000-0000-4000-8000-000000000001',
   '33333333-3333-4333-8333-333333333333',
   'Saya baru 3 bulan di Hamamatsu dan masih bingung soal perpanjangan visa sambil kerja shift malam. Boleh minta arahannya?',
   'diterima')
on conflict do nothing;

-- Seeded with the publish guard disabled: it deliberately refuses to let a
-- plain member publish, and a seed run has no pengurus session to be one.
alter table blog_posts disable trigger blog_posts_guard_publish;

insert into blog_posts (id, author_id, title, slug, content, category, tags, status)
values
  ('c3000000-0000-4000-8000-000000000001',
   '44444444-4444-4444-8444-444444444444',
   'Setahun kerja shift malam sambil kuliah daring',
   'setahun-shift-malam-kuliah-daring',
   '<p>Waktu pertama datang, saya pikir bagian tersulitnya adalah bahasa. Ternyata bukan.</p><h2>Yang paling berat: mengatur tidur</h2><p>Shift malam berarti pulang jam tujuh pagi, sementara kuliah daring mulai jam sembilan. Selama tiga bulan pertama saya memaksakan keduanya dan hasilnya buruk di dua-duanya.</p><p>Yang akhirnya berhasil: tidur dua jam sepulang kerja, kuliah, lalu tidur lagi sampai sore. Bukan ideal, tapi bertahan.</p><h2>Soal uang</h2><p>Gaji shift malam memang lebih besar, tapi jangan dihitung sebagai gaji tetap kalau kesehatanmu belum tentu kuat setahun penuh.</p><blockquote>Kalau boleh menyarankan satu hal: jangan ambil lembur di minggu ujian. Uangnya tidak sepadan.</blockquote>',
   'Kuliah sambil kerja', array['shift-malam','kuliah'], 'terbit'),
  ('c3000000-0000-4000-8000-000000000002',
   '33333333-3333-4333-8333-333333333333',
   'Tiga bulan pertama di Hamamatsu',
   'tiga-bulan-pertama-di-hamamatsu',
   '<p>Catatan kecil dari anggota baru, siapa tahu berguna buat yang menyusul.</p><p>Hal pertama yang saya urus adalah kartu asuransi kesehatan di kantor kota. Prosesnya lebih cepat dari dugaan saya, sekitar tiga puluh menit, tapi bawa zairyu card dan stempel pribadi.</p><p>Yang saya sesali: tidak langsung buka rekening bank di minggu pertama. Beberapa tempat kerja part-time menolak lamaran kalau belum punya rekening lokal.</p>',
   'Hidup di Jepang', array['adaptasi'], 'ditinjau')
on conflict (id) do nothing;

alter table blog_posts enable trigger blog_posts_guard_publish;

insert into blog_comments (post_id, author_id, content)
values
  ('c3000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'Bagian soal jangan lembur di minggu ujian itu kena banget. Saya belajar itu dengan cara yang mahal.')
on conflict do nothing;

insert into blog_likes (post_id, user_id)
values
  ('c3000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111'),
  ('c3000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')
on conflict do nothing;

-- An archived period, so the period switcher has something to switch between.
insert into org_periods (year_label, is_active)
values ('2024/2025', false)
on conflict (year_label) do nothing;

insert into org_positions (id, period_id, parent_position_id, name, description, sort_order)
select v.id::uuid, o.id, v.parent::uuid, v.name, v.description, v.ord
from (values
  ('e5000000-0000-4000-8000-000000000001', null, 'Ketua Umum',
   'Memimpin dan mewakili UJC, serta menyetujui pengajuan lintas divisi.', 1),
  ('e5000000-0000-4000-8000-000000000002', 'e5000000-0000-4000-8000-000000000001', 'Wakil Ketua',
   'Mendampingi ketua dan mengambil alih saat ketua berhalangan.', 2),
  ('e5000000-0000-4000-8000-000000000003', 'e5000000-0000-4000-8000-000000000001', 'Sekretaris',
   'Notulen rapat, arsip dokumen, dan surat resmi organisasi.', 3),
  ('e5000000-0000-4000-8000-000000000004', 'e5000000-0000-4000-8000-000000000001', 'Bendahara',
   'Kas komunitas, anggaran kegiatan, dan transparansi donasi UJC Peduli.', 4),
  ('e5000000-0000-4000-8000-000000000005', 'e5000000-0000-4000-8000-000000000001', 'Divisi Pendidikan',
   'Bank soal CBT, materi belajar, dan program mentorship.', 5),
  ('e5000000-0000-4000-8000-000000000006', 'e5000000-0000-4000-8000-000000000001', 'Divisi Kegiatan',
   'Kopdar, workshop, webinar, dan absensi peserta.', 6),
  ('e5000000-0000-4000-8000-000000000007', 'e5000000-0000-4000-8000-000000000001', 'Divisi Media & Publikasi',
   'Kalender konten, pengumuman, galeri, dan blog komunitas.', 7),
  ('e5000000-0000-4000-8000-000000000008', 'e5000000-0000-4000-8000-000000000006', 'Seksi Dokumentasi',
   'Foto dan video kegiatan untuk arsip dan publikasi.', 1)
) as v(id, parent, name, description, ord)
cross join (select id from org_periods where is_active limit 1) o
on conflict (id) do nothing;

insert into org_members (position_id, user_id, display_name, motto, city, contact, status, sort_order)
values
  ('e5000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Rina Hartono', 'Sedikit demi sedikit, lama-lama jadi bukit.', 'Nagoya',
   '{"Instagram":"https://instagram.com/"}'::jsonb, 'aktif', 1),
  ('e5000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222',
   'Dimas Prakoso', 'Tanya dulu, malu kemudian.', 'Osaka', '{}'::jsonb, 'aktif', 1),
  ('e5000000-0000-4000-8000-000000000006', '44444444-4444-4444-8444-444444444444',
   'Bagus Setiawan', 'Kumpul dulu, urusan belakangan.', 'Tokyo', '{}'::jsonb, 'aktif', 1),
  ('e5000000-0000-4000-8000-000000000008', null,
   'Yusuf Ramadhan', null, 'Yokohama', '{}'::jsonb, 'cuti', 1)
on conflict do nothing;

-- lat/lng are left null on purpose: the map plots fixed prefecture centroids
-- shipped with the app, so exact positions are never needed. Osaka is opted
-- out to exercise the is_visible filter.
insert into member_locations (user_id, prefecture, city, is_visible)
values
  ('11111111-1111-4111-8111-111111111111', 'Aichi', 'Nagoya', true),
  ('33333333-3333-4333-8333-333333333333', 'Shizuoka', 'Hamamatsu', true),
  ('44444444-4444-4444-8444-444444444444', 'Tokyo', 'Shinjuku', true),
  ('22222222-2222-4222-8222-222222222222', 'Osaka', 'Osaka', false)
on conflict (user_id) do nothing;

insert into workshops (id, title, description, type, speaker, scheduled_at, capacity, meeting_link, recording_url, created_by)
values
  ('d5000000-0000-4000-8000-000000000001', 'Persiapan JLPT N3 dalam 3 bulan',
   'Strategi belajar untuk yang kerja penuh waktu, dibawakan alumni yang lulus N2 sambil kerja shift.',
   'webinar', 'Dimas Prakoso', now() + interval '12 days', 100,
   'https://meet.google.com/ujc-n3', null, '22222222-2222-4222-8222-222222222222'),
  ('d5000000-0000-4000-8000-000000000002', 'Workshop menulis rirekisho',
   'Praktik langsung menulis rirekisho dan shokumu keirekisho yang benar.',
   'workshop', 'Rina Hartono', now() + interval '26 days', 25, null, null,
   '11111111-1111-4111-8111-111111111111'),
  ('d5000000-0000-4000-8000-000000000003', 'Seminar hak pekerja asing di Jepang',
   'Apa yang wajib diberikan perusahaan, dan ke mana mengadu kalau dilanggar.',
   'seminar', 'Narasumber tamu', now() - interval '20 days', null, null,
   'https://example.com/rekaman-hak-pekerja', '11111111-1111-4111-8111-111111111111')
on conflict (id) do nothing;

-- Seeded with the verification guard disabled: it correctly refuses to let a
-- member publish their own listing, and a seed run has no pengurus session.
alter table businesses disable trigger businesses_guard_verification;

insert into businesses (id, owner_id, name, category, description, contact, city, is_verified)
values
  ('d6000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444',
   'Jastip Tokyo - Indonesia', 'Jasa titip',
   'Titip barang dari Jepang ke Indonesia tiap bulan. Kosmetik, obat, camilan, elektronik kecil. Ongkir dihitung per kilo.',
   'LINE: @jastiptokyo', 'Tokyo', true),
  ('d6000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'Terjemahan dokumen ID-JP', 'Terjemahan',
   'Terjemahan dokumen resmi, surat lamaran, dan pendampingan rapat daring. Sudah biasa menangani dokumen imigrasi.',
   'WA: 080-xxxx-xxxx', 'Osaka', true),
  ('d6000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
   'Katering rumahan Hamamatsu', 'Katering & makanan',
   'Masakan Indonesia rumahan, halal, bisa diantar area Hamamatsu. Terima pesanan untuk acara kecil.',
   'IG: @dapurhamamatsu', 'Hamamatsu', false)
on conflict (id) do nothing;

alter table businesses enable trigger businesses_guard_verification;

insert into workshop_registrations (workshop_id, user_id)
values
  ('d5000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333'),
  ('d5000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444')
on conflict do nothing;

-- Karya kreatif contoh. Trigger guard menolak insert dengan is_approved=true
-- dari non-pengurus, dan seed tidak punya sesi — jadi dinonaktifkan sebentar.
alter table creative_works disable trigger creative_works_guard;
insert into creative_works (id, submitted_by, title, description, url, platform, youtube_id, is_approved, is_featured)
values
  ('d7000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
   'Vlog: Sehari kerja di pabrik sambil kuliah daring',
   'Rutinitas shift pagi, belajar di jam istirahat, dan tips atur energi.',
   'https://www.youtube.com/watch?v=contohUJC01', 'youtube', 'contohUJC01', true, true),
  ('d7000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444',
   'Fotografi: Musim gugur di Kyoto',
   'Seri foto momiji dari kamera HP, diambil saat libur shift.',
   'https://www.instagram.com/p/contoh-momiji/', 'instagram', null, true, false),
  ('d7000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222',
   'Cover lagu: Sakura (Ikimono Gakari)',
   'Direkam di kamar apato, gitar akustik.',
   'https://www.youtube.com/watch?v=contohUJC02', 'youtube', 'contohUJC02', true, false),
  ('d7000000-0000-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333',
   'Komik strip: Salah naik kereta ekspres',
   'Pengalaman pertama kali salah naik kaisoku.',
   'https://www.instagram.com/p/contoh-komik/', 'instagram', null, false, false)
on conflict (id) do nothing;
alter table creative_works enable trigger creative_works_guard;

-- Gives the seeded member a non-zero gamification score.
insert into user_points (user_id, points, source)
values
  ('33333333-3333-4333-8333-333333333333', 40, 'forum'),
  ('33333333-3333-4333-8333-333333333333', 25, 'cbt'),
  ('11111111-1111-4111-8111-111111111111', 120, 'forum')
on conflict do nothing;

-- Absensi kegiatan. Kode untuk acara yang sudah lewat sengaja dibiarkan
-- terbuka lama supaya panel panitia dan e-sertifikat bisa dicoba kapan saja
-- di lingkungan pengembangan.
insert into event_checkin_codes (event_id, code, opens_at, closes_at)
values
  ('e0000000-0000-4000-8000-000000000004', 'HALALBIHALAL',
   now() - interval '90 days', now() + interval '365 days'),
  ('e0000000-0000-4000-8000-000000000002', 'JLPTN3',
   now() - interval '1 day', now() + interval '30 days')
on conflict (event_id) do nothing;

-- Kehadiran contoh; trigger 0027 yang menerbitkan sertifikatnya.
insert into event_checkins (event_id, user_id, method)
values
  ('e0000000-0000-4000-8000-000000000004',
   '33333333-3333-4333-8333-333333333333', 'qr'),
  ('e0000000-0000-4000-8000-000000000004',
   '22222222-2222-4222-8222-222222222222', 'kode')
on conflict (event_id, user_id) do nothing;
