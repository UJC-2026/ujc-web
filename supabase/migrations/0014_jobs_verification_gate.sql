-- The job board exists to keep scam postings away from members, and
-- is_verified is the gate: only verified listings are publicly readable.
--
-- But the insert policy only checked `is_pengurus() AND posted_by = auth.uid()`
-- and said nothing about is_verified, so a pengurus could post a listing that
-- was already marked verified and skip review entirely. Updating it afterwards
-- was correctly blocked — they simply never needed to.
--
-- Verification is now always a separate moderator action, the same way a
-- peduli case cannot be published by the member who submitted it.

drop policy if exists "pengurus posting lowongan" on jobs;

create policy "pengurus posting lowongan" on jobs for insert
  with check (
    is_pengurus()
    and posted_by = auth.uid()
    and not is_verified
  );
