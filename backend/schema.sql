-- Review and apply to the selected Supabase project; not yet applied.
begin;
create table public.wurld_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.wurld_admins enable row level security;
grant select on public.wurld_admins to authenticated;
revoke all on public.wurld_admins from anon;
create policy "Read own studio membership" on public.wurld_admins for select to authenticated using (user_id=(select auth.uid()));
create table public.wurld_artworks (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(trim(title)) between 1 and 160),
 description text not null default '' check(length(description)<=5000),
 year integer check(year between 1900 and 2100),
 medium text not null default '' check(length(medium)<=160),
 dimensions text not null default '' check(length(dimensions)<=100),
 price numeric(12,2) check(price between 0 and 1000000000),
 status text not null default 'available' check(status in ('available','sold','not_for_sale')),
 category text not null default 'catalogue' check(category in ('catalogue','featured','series')),
 image_paths text[] not null check(cardinality(image_paths) between 1 and 6),
 published boolean not null default false,
 archived boolean not null default false,
 revision integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(not (archived and published))
);
alter table public.wurld_artworks enable row level security;
grant select on public.wurld_artworks to anon,authenticated;
grant insert,update on public.wurld_artworks to authenticated;
create policy "Visitors read published artworks" on public.wurld_artworks for select to anon,authenticated using(published and not archived);
create policy "Studio reads all artworks" on public.wurld_artworks for select to authenticated using(exists(select 1 from public.wurld_admins where user_id=(select auth.uid())));
create policy "Studio adds artworks" on public.wurld_artworks for insert to authenticated with check(exists(select 1 from public.wurld_admins where user_id=(select auth.uid())));
create policy "Studio edits artworks" on public.wurld_artworks for update to authenticated using(exists(select 1 from public.wurld_admins where user_id=(select auth.uid()))) with check(exists(select 1 from public.wurld_admins where user_id=(select auth.uid())));
create function public.wurld_artwork_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  new.id=old.id; new.created_at=old.created_at; new.revision=old.revision+1;
 end if;
 if exists(select 1 from unnest(new.image_paths) as p where p not like new.id::text || '/%.webp' or p like '%..%') then raise exception 'Invalid artwork image path'; end if;
 new.updated_at=now(); return new;
end; $$;
revoke execute on function public.wurld_artwork_revision() from public,anon,authenticated;
create trigger wurld_artwork_revision before insert or update on public.wurld_artworks for each row execute function public.wurld_artwork_revision();
create index wurld_artworks_public_order on public.wurld_artworks(created_at desc,id) where published and not archived;
create index wurld_artworks_images on public.wurld_artworks using gin(image_paths);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('wurld-artworks','wurld-artworks',false,6291456,array['image/webp']);
create policy "Studio uploads artwork images" on storage.objects for insert to authenticated with check(bucket_id='wurld-artworks' and exists(select 1 from public.wurld_admins where user_id=(select auth.uid())));
create policy "Studio reads artwork images" on storage.objects for select to authenticated using(bucket_id='wurld-artworks' and exists(select 1 from public.wurld_admins where user_id=(select auth.uid())));
create policy "Visitors read published artwork images" on storage.objects for select to anon,authenticated using(bucket_id='wurld-artworks' and exists(select 1 from public.wurld_artworks a where a.published and not a.archived and a.image_paths @> array[name]));
commit;
-- Authorisation is granted only by the database owner after creating/inviting
-- the painter's verified Auth account. Never allow client membership inserts.
-- INSERT INTO public.wurld_admins(user_id) VALUES (<verified_auth_user_uuid>);
-- Private image URLs expire after 300 seconds; already viewed/downloaded images
-- cannot be recalled. Unreferenced uploads are kept private for safe recovery.
