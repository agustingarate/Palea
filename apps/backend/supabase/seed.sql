insert into public.profile_interests (name, slug, label_es, label_en)
values
  ('Producto', 'producto', 'Producto', 'Product'),
  ('Tecnología', 'tecnologia', 'Tecnología', 'Technology'),
  ('Diseño', 'diseno', 'Diseño', 'Design'),
  ('Datos', 'datos', 'Datos', 'Data'),
  ('Liderazgo', 'liderazgo', 'Liderazgo', 'Leadership')
on conflict (slug) do update set name = excluded.name, label_es = excluded.label_es, label_en = excluded.label_en, is_active = true;

insert into public.skills (name, slug, label_es, label_en)
values
  ('JavaScript', 'javascript', 'JavaScript', 'JavaScript'),
  ('TypeScript', 'typescript', 'TypeScript', 'TypeScript'),
  ('React', 'react', 'React', 'React'),
  ('NestJS', 'nestjs', 'NestJS', 'NestJS'),
  ('PostgreSQL', 'postgresql', 'PostgreSQL', 'PostgreSQL'),
  ('Diseño de producto', 'diseno-de-producto', 'Diseño de producto', 'Product design'),
  ('Gestión de proyectos', 'gestion-de-proyectos', 'Gestión de proyectos', 'Project management')
on conflict (slug) do update set name = excluded.name, label_es = excluded.label_es, label_en = excluded.label_en, is_active = true;
