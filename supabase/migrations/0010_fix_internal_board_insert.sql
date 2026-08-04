-- The internal board is meant to be pengurus-only, but any signed-in member
-- could insert into it.
--
-- Two permissive policies applied to INSERT at once:
--   "pengurus tulis papan internal"  check: is_pengurus() AND author_id = uid
--   "penulis kelola papannya" (FOR ALL) check: author_id = uid OR is_pimpinan()
--
-- Permissive policies are OR'd, so satisfying the second was enough. A member
-- posting under their own id passed, bypassing the pengurus requirement. They
-- could not read the board back, which is why this stayed invisible.
--
-- The author policy only ever needed to cover editing and deleting your own
-- post, so it is narrowed to UPDATE and DELETE. INSERT is left to the
-- pengurus-only policy, which is the single gate again.

drop policy if exists "penulis kelola papannya" on internal_board;

create policy "penulis ubah papannya" on internal_board for update
  using (author_id = auth.uid() or is_pimpinan())
  with check (author_id = auth.uid() or is_pimpinan());

create policy "penulis hapus papannya" on internal_board for delete
  using (author_id = auth.uid() or is_pimpinan());

drop policy if exists "penulis kelola balasan papan" on internal_board_replies;

create policy "penulis ubah balasan papan" on internal_board_replies for update
  using (author_id = auth.uid() or is_pimpinan())
  with check (author_id = auth.uid() or is_pimpinan());

create policy "penulis hapus balasan papan" on internal_board_replies for delete
  using (author_id = auth.uid() or is_pimpinan());
