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

-- Plantilla oficial autorizada para EvalDoc; las preguntas usadas nunca se
-- modifican: una revisión futura debe crear otra fila con version mayor.
insert into public.survey_templates (name, description, version, active)
values (
  'Evaluación docente oficial',
  'Quince reactivos oficiales de evaluación docente',
  1,
  true
)
on conflict do nothing;

insert into public.survey_questions (
  survey_template_id, position, dimension, prompt, question_type, required, active
)
select t.id, q.position, q.label, q.label, 'scale'::public.question_type, true, true
from public.survey_templates t
cross join (values
  (1, 'Dominio de la materia'),
  (2, 'Planeación de clases'),
  (3, 'Claridad en las explicaciones'),
  (4, 'Fomento de la participación'),
  (5, 'Uso de recursos didácticos'),
  (6, 'Resolución de dudas'),
  (7, 'Puntualidad'),
  (8, 'Asistencia'),
  (9, 'Cumplimiento del programa'),
  (10, 'Retroalimentación'),
  (11, 'Evaluación objetiva'),
  (12, 'Uso de tecnología'),
  (13, 'Trato respetuoso'),
  (14, 'Motivación al aprendizaje'),
  (15, 'Satisfacción general')
) as q(position, label)
where t.institution_id is null
  and t.name = 'Evaluación docente oficial'
  and t.version = 1
on conflict (survey_template_id, position) do nothing;
