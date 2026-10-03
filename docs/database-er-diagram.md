# DER lógico de EvalDoc

El diagrama representa las 18 tablas públicas del esquema final. `auth.users` es una entidad gestionada por Supabase Auth; `profiles.id` la referencia 1:1. Las relaciones con `institution_id` se implementan con claves compuestas donde se requiere aislamiento. Una plantilla global tiene `institution_id` nulo.

```mermaid
erDiagram
  institutions ||--o{ campuses : contiene
  institutions ||--o{ profiles : registra
  institutions ||--o{ academic_periods : organiza
  institutions ||--o{ programs : ofrece
  institutions ||--o{ facilities : dispone
  institutions ||--o{ survey_templates : configura
  profiles ||--o{ user_roles : recibe
  roles ||--o{ user_roles : clasifica
  campuses |o--o{ programs : ubica
  campuses |o--o{ facilities : ubica
  programs ||--o{ subjects : agrupa
  programs ||--o{ program_facilities : usa
  facilities ||--o{ program_facilities : sirve
  subjects ||--o{ groups : abre
  academic_periods ||--o{ groups : programa
  groups ||--o{ teaching_assignments : asigna
  profiles ||--o{ teaching_assignments : docente
  groups ||--o{ student_enrollments : inscribe
  profiles ||--o{ student_enrollments : alumno
  survey_templates ||--o{ survey_questions : contiene
  survey_templates ||--o{ evaluation_windows : utiliza
  academic_periods ||--o{ evaluation_windows : delimita
  evaluation_windows ||--o{ evaluations : recibe
  teaching_assignments ||--o{ evaluations : evaluada
  profiles ||--o{ evaluations : alumno_interno
  evaluations ||--o{ evaluation_answers : contiene
  survey_questions ||--o{ evaluation_answers : responde

  institutions { uuid id PK text name text slug UK }
  campuses { uuid id PK uuid institution_id FK text code }
  profiles { uuid id PK uuid institution_id FK text status }
  roles { uuid id PK text code UK }
  user_roles { uuid id PK uuid profile_id FK uuid role_id FK uuid institution_id FK }
  academic_periods { uuid id PK uuid institution_id FK timestamptz starts_at timestamptz ends_at }
  programs { uuid id PK uuid institution_id FK uuid campus_id FK }
  facilities { uuid id PK uuid institution_id FK uuid campus_id FK text facility_type }
  program_facilities { uuid program_id PK,FK uuid facility_id PK,FK }
  subjects { uuid id PK uuid program_id FK }
  groups { uuid id PK uuid subject_id FK uuid academic_period_id FK }
  teaching_assignments { uuid id PK uuid group_id FK uuid teacher_id FK }
  student_enrollments { uuid id PK uuid group_id FK uuid student_id FK }
  survey_templates { uuid id PK uuid institution_id FK int version }
  survey_questions { uuid id PK uuid survey_template_id FK int position }
  evaluation_windows { uuid id PK uuid academic_period_id FK uuid survey_template_id FK }
  evaluations { uuid id PK uuid student_id FK uuid teaching_assignment_id FK uuid evaluation_window_id FK }
  evaluation_answers { uuid id PK uuid evaluation_id FK uuid question_id FK numeric numeric_value }
```

El DER es conceptual para lectura. El [diccionario](data-dictionary.md) y las [migraciones](../supabase/migrations/) son la referencia de tipos y cardinalidades exactas. Las evaluaciones y respuestas son privadas: las relaciones del diagrama no implican permiso de consulta.
