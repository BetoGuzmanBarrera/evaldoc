-- Safe, repeatable local reference data only. No users or credentials.
insert into public.institutions (name, short_name, slug)
values
  ('Instituto Politécnico Nacional', 'IPN', 'ipn'),
  ('Universidad Nacional Autónoma de México', 'UNAM', 'unam'),
  ('Universidad del Valle de México', 'UVM', 'uvm'),
  ('Tecnológico de Monterrey', 'Tec de Monterrey', 'tecnologico-de-monterrey'),
  ('Universidad Autónoma Metropolitana', 'UAM', 'uam'),
  ('Universidad Iberoamericana', 'Ibero', 'universidad-iberoamericana'),
  ('Universidad Anáhuac', 'Anáhuac', 'universidad-anahuac')
on conflict (slug) do nothing;

insert into public.roles (code, name)
values
  ('student', 'Alumno'),
  ('teacher', 'Docente'),
  ('coordinator', 'Coordinador'),
  ('hr', 'Recursos Humanos'),
  ('admin', 'Administrador')
on conflict (code) do nothing;
