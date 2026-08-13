insert into public.profile_interests (name, slug)
values
  ('Producto', 'producto'),
  ('Tecnología', 'tecnologia'),
  ('Diseño', 'diseno'),
  ('Datos', 'datos'),
  ('Liderazgo', 'liderazgo')
on conflict (slug) do update set name = excluded.name, is_active = true;

insert into public.skills (name, slug)
values
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('NestJS', 'nestjs'),
  ('PostgreSQL', 'postgresql'),
  ('Diseño de producto', 'diseno-de-producto'),
  ('Gestión de proyectos', 'gestion-de-proyectos')
on conflict (slug) do update set name = excluded.name, is_active = true;
