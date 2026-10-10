-- Private Storage bucket for chore proof photos.
-- Object path convention: <family_id>/<chore_id>/<timestamp>.<ext>
-- Access is scoped to family membership through the first path segment, so a kid's photo
-- is only ever readable by that kid's own family. Signed URLs (1 hour) are used to display it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chore-proofs', 'chore-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "family members read chore proofs" on storage.objects
  for select to authenticated
  using (bucket_id = 'chore-proofs' and public.is_family_member(((storage.foldername(name))[1])::uuid));

create policy "family members upload chore proofs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chore-proofs' and public.is_family_member(((storage.foldername(name))[1])::uuid));

create policy "parents remove chore proofs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chore-proofs' and public.is_family_parent(((storage.foldername(name))[1])::uuid));
