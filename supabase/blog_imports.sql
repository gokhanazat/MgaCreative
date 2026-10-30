-- =====================================================================
-- MGA Creative — Agent taslaklarının içe aktarım kaydı
-- Supabase panelinde: SQL Editor > New query > yapıştır > Run
-- (blog_posts.sql daha önce çalıştırılmış olmalı. Tekrar çalıştırılabilir.)
-- =====================================================================

-- Admin panel, GitHub'daki blog-inbox dalından aldığı her dosyayı buraya yazar.
-- Böylece bir taslağı silsen bile aynı dosya tekrar içe alınmaz.
create table if not exists public.blog_imports (
    path         text primary key,
    slug         text,
    imported_at  timestamptz not null default now()
);

alter table public.blog_imports enable row level security;

drop policy if exists "blog_imports: admin okur" on public.blog_imports;
create policy "blog_imports: admin okur" on public.blog_imports
    for select to authenticated using (public.is_blog_admin());

drop policy if exists "blog_imports: admin ekler" on public.blog_imports;
create policy "blog_imports: admin ekler" on public.blog_imports
    for insert to authenticated with check (public.is_blog_admin());

select 'blog_imports hazır' as durum;
