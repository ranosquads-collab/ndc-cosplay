-- À exécuter une fois dans Neon si l'ancienne version a enregistré des chemins /uploads/.
-- Retire les références de photos locales devenues indisponibles sur Vercel.
update public.products
set images = coalesce((
  select array_agg(url)
  from unnest(images) as url
  where url not like '/uploads/%'
), '{}'::text[])
where exists (select 1 from unnest(images) as image_url(url) where url like '/uploads/%');

delete from public.home_images where url like '/uploads/%';
