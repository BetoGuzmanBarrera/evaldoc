# Diccionario de datos de EvalDoc

Fuente: catálogo PostgreSQL local tras las ocho migraciones de supabase/migrations/. La restricción indica los nombres reales de PK, FK, UNIQUE o CHECK donde la columna participa. Para reglas entre varias columnas y políticas RLS, véase database-physical-model.md y las migraciones. auth.users pertenece a Supabase Auth.

## academic_periods

Ciclos académicos por institución

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:academic_periods_institution_id_id_key, PK:academic_periods_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:academic_periods_institution_id_fkey, UNIQUE:academic_periods_institution_id_id_key, UNIQUE:academic_periods_institution_id_name_key | Institución propietaria |
| name | text | No |  | UNIQUE:academic_periods_institution_id_name_key, CHECK:academic_periods_name_check | Nombre visible |
| starts_at | timestamp with time zone | No |  | CHECK:academic_periods_check | Inicio de vigencia |
| ends_at | timestamp with time zone | No |  | CHECK:academic_periods_check | Fin de vigencia |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## campuses

Sedes de la institución

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:campuses_institution_id_id_key, PK:campuses_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | UNIQUE:campuses_institution_id_code_key, FK:campuses_institution_id_fkey, UNIQUE:campuses_institution_id_id_key | Institución propietaria |
| name | text | No |  | CHECK:campuses_name_check | Nombre visible |
| code | text | No |  | CHECK:campuses_code_check, UNIQUE:campuses_institution_id_code_key | Código de catálogo |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## evaluation_answers

Respuestas privadas por evaluación

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:evaluation_answers_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| evaluation_id | uuid | No | FK | FK:evaluation_answers_evaluation_id_fkey, UNIQUE:evaluation_answers_evaluation_id_question_id_key | Evaluación |
| question_id | uuid | No | FK | UNIQUE:evaluation_answers_evaluation_id_question_id_key, FK:evaluation_answers_question_id_fkey | Reactivo |
| numeric_value | numeric(4,2) | Sí |  | CHECK:evaluation_answers_check, CHECK:evaluation_answers_numeric_value_check | Calificación numérica de 0 a 10 |
| text_value | text | Sí |  | CHECK:evaluation_answers_check | Respuesta de texto opcional |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## evaluation_windows

Ventanas temporales de encuesta

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:evaluation_windows_institution_id_id_academic_period_id_key, PK:evaluation_windows_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:evaluation_windows_institution_id_academic_period_id_fkey, UNIQUE:evaluation_windows_institution_id_academic_period_id_name_key, FK:evaluation_windows_institution_id_fkey, UNIQUE:evaluation_windows_institution_id_id_academic_period_id_key | Institución propietaria |
| academic_period_id | uuid | No | FK | FK:evaluation_windows_institution_id_academic_period_id_fkey, UNIQUE:evaluation_windows_institution_id_academic_period_id_name_key, UNIQUE:evaluation_windows_institution_id_id_academic_period_id_key | Periodo académico |
| survey_template_id | uuid | No | FK | FK:evaluation_windows_survey_template_id_fkey | Plantilla de encuesta |
| name | text | No |  | UNIQUE:evaluation_windows_institution_id_academic_period_id_name_key, CHECK:evaluation_windows_name_check | Nombre visible |
| starts_at | timestamp with time zone | No |  | CHECK:evaluation_windows_check | Inicio de vigencia |
| ends_at | timestamp with time zone | No |  | CHECK:evaluation_windows_check | Fin de vigencia |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## evaluations

Envíos de evaluación, con alumno interno

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:evaluations_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:evaluations_institution_id_evaluation_window_id_academic_p_fkey, FK:evaluations_institution_id_fkey, FK:evaluations_institution_id_student_id_fkey, FK:evaluations_institution_id_teaching_assignment_id_academic_fkey | Institución propietaria |
| academic_period_id | uuid | No | FK | FK:evaluations_institution_id_evaluation_window_id_academic_p_fkey, FK:evaluations_institution_id_teaching_assignment_id_academic_fkey, UNIQUE:evaluations_student_assignment_period_key | Periodo académico |
| evaluation_window_id | uuid | No | FK | FK:evaluations_institution_id_evaluation_window_id_academic_p_fkey, UNIQUE:evaluations_student_id_teaching_assignment_id_evaluation_wi_key | Ventana de evaluación |
| teaching_assignment_id | uuid | No | FK | FK:evaluations_institution_id_teaching_assignment_id_academic_fkey, UNIQUE:evaluations_student_assignment_period_key, UNIQUE:evaluations_student_id_teaching_assignment_id_evaluation_wi_key | Asignación docente |
| student_id | uuid | No | FK | FK:evaluations_institution_id_student_id_fkey, UNIQUE:evaluations_student_assignment_period_key, UNIQUE:evaluations_student_id_teaching_assignment_id_evaluation_wi_key | Alumno interno |
| status | evaluation_status | No |  | CHECK:evaluations_check; DEFAULT 'pending'::evaluation_status | Estado del registro |
| started_at | timestamp with time zone | Sí |  | CHECK:evaluations_check | Inicio registrado |
| submitted_at | timestamp with time zone | Sí |  | CHECK:evaluations_check | Momento de envío |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## facilities

Instalaciones y talleres por institución/campus

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:facilities_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:facilities_institution_id_campus_id_fkey, FK:facilities_institution_id_fkey | Institución propietaria |
| campus_id | uuid | Sí | FK | FK:facilities_institution_id_campus_id_fkey | Campus asociado; nulo significa alcance institucional |
| name | text | No |  | CHECK:facilities_name_check | Nombre visible |
| facility_type | text | No |  | CHECK:facilities_facility_type_check | Tipo normalizado de instalación |
| description | text | Sí |  | CHECK:facilities_description_check | Descripción opcional |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## groups

Grupos de materia y periodo

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:groups_institution_id_id_academic_period_id_key, PK:groups_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:groups_institution_id_academic_period_id_fkey, FK:groups_institution_id_fkey, UNIQUE:groups_institution_id_id_academic_period_id_key, UNIQUE:groups_institution_id_subject_id_academic_period_id_code_key, FK:groups_institution_id_subject_id_fkey | Institución propietaria |
| subject_id | uuid | No | FK | UNIQUE:groups_institution_id_subject_id_academic_period_id_code_key, FK:groups_institution_id_subject_id_fkey | Materia |
| academic_period_id | uuid | No | FK | FK:groups_institution_id_academic_period_id_fkey, UNIQUE:groups_institution_id_id_academic_period_id_key, UNIQUE:groups_institution_id_subject_id_academic_period_id_code_key | Periodo académico |
| code | text | No |  | CHECK:groups_code_check, UNIQUE:groups_institution_id_subject_id_academic_period_id_code_key | Código de catálogo |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## institutions

Instituciones

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:institutions_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| name | text | No |  | CHECK:institutions_name_check | Nombre visible |
| short_name | text | No |  | CHECK:institutions_short_name_check | Nombre abreviado |
| slug | text | No |  | CHECK:institutions_slug_check, UNIQUE:institutions_slug_key | Identificador URL de institución |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## profiles

Perfil uno a uno con Auth

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK, FK | FK:profiles_id_auth_users_fkey, UNIQUE:profiles_institution_id_id_key, PK:profiles_pkey | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:profiles_institution_id_fkey, UNIQUE:profiles_institution_id_id_key | Institución propietaria |
| full_name | text | No |  | CHECK:profiles_full_name_check | Nombre completo |
| institutional_email | text | No |  | CHECK:profiles_institutional_email_check | Correo institucional del perfil |
| institutional_identifier | text | Sí |  | CHECK:profiles_institutional_identifier_check | Identificador institucional sin privilegios |
| status | user_status | No |  | DEFAULT 'pending'::user_status | Estado del registro |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## program_facilities

Relación programa–instalación

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| program_id | uuid | No | PK, FK | PK:program_facilities_pkey, FK:program_facilities_program_id_fkey | Programa o carrera |
| facility_id | uuid | No | PK, FK | FK:program_facilities_facility_id_fkey, PK:program_facilities_pkey | Instalación o taller |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## programs

Carreras o programas por sede

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:programs_institution_id_id_key, PK:programs_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:programs_institution_id_campus_id_fkey, UNIQUE:programs_institution_id_code_key, FK:programs_institution_id_fkey, UNIQUE:programs_institution_id_id_key | Institución propietaria |
| campus_id | uuid | Sí | FK | FK:programs_institution_id_campus_id_fkey | Campus asociado; nulo significa alcance institucional |
| name | text | No |  | CHECK:programs_name_check | Nombre visible |
| code | text | No |  | CHECK:programs_code_check, UNIQUE:programs_institution_id_code_key | Código de catálogo |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## roles

Catálogo de roles

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:roles_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| code | text | No |  | CHECK:roles_code_check, UNIQUE:roles_code_key | Código de catálogo |
| name | text | No |  | CHECK:roles_name_check | Nombre visible |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## student_enrollments

Inscripciones de alumnos

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:student_enrollments_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:student_enrollments_institution_id_fkey, FK:student_enrollments_institution_id_group_id_academic_perio_fkey, FK:student_enrollments_institution_id_student_id_fkey | Institución propietaria |
| student_id | uuid | No | FK | FK:student_enrollments_institution_id_student_id_fkey, UNIQUE:student_enrollments_student_id_group_id_academic_period_id_key | Alumno interno |
| group_id | uuid | No | FK | FK:student_enrollments_institution_id_group_id_academic_perio_fkey, UNIQUE:student_enrollments_student_id_group_id_academic_period_id_key | Grupo académico |
| academic_period_id | uuid | No | FK | FK:student_enrollments_institution_id_group_id_academic_perio_fkey, UNIQUE:student_enrollments_student_id_group_id_academic_period_id_key | Periodo académico |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## subjects

Materias del programa

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:subjects_institution_id_id_key, PK:subjects_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | UNIQUE:subjects_institution_id_code_key, FK:subjects_institution_id_fkey, UNIQUE:subjects_institution_id_id_key, FK:subjects_institution_id_program_id_fkey | Institución propietaria |
| program_id | uuid | Sí | FK | FK:subjects_institution_id_program_id_fkey | Programa o carrera |
| name | text | No |  | CHECK:subjects_name_check | Nombre visible |
| code | text | No |  | CHECK:subjects_code_check, UNIQUE:subjects_institution_id_code_key | Código de catálogo |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## survey_questions

Reactivos de plantilla

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:survey_questions_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| survey_template_id | uuid | No | FK | FK:survey_questions_survey_template_id_fkey, UNIQUE:survey_questions_survey_template_id_position_key | Plantilla de encuesta |
| position | integer | No |  | CHECK:survey_questions_position_check, UNIQUE:survey_questions_survey_template_id_position_key | Orden del reactivo |
| dimension | text | No |  | CHECK:survey_questions_dimension_check | Dimensión evaluada |
| prompt | text | No |  | CHECK:survey_questions_prompt_check | Texto del reactivo |
| question_type | question_type | No |  |  | Tipo de respuesta |
| required | boolean | No |  | DEFAULT true | Respuesta obligatoria |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## survey_templates

Plantillas versionadas

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:survey_templates_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | Sí | FK | FK:survey_templates_institution_id_fkey | Institución propietaria |
| name | text | No |  | CHECK:survey_templates_name_check | Nombre visible |
| description | text | Sí |  |  | Descripción opcional |
| version | integer | No |  | CHECK:survey_templates_version_check | Versión de plantilla |
| active | boolean | No |  | DEFAULT true | Indicador de vigencia |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |
| updated_at | timestamp with time zone | No |  | DEFAULT now() | Última actualización |

## teaching_assignments

Docente asignado a grupo

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | UNIQUE:teaching_assignments_institution_id_id_academic_period_id_key, PK:teaching_assignments_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| institution_id | uuid | No | FK | FK:teaching_assignments_institution_id_fkey, FK:teaching_assignments_institution_id_group_id_academic_peri_fkey, UNIQUE:teaching_assignments_institution_id_id_academic_period_id_key, FK:teaching_assignments_institution_id_teacher_id_fkey | Institución propietaria |
| teacher_id | uuid | No | FK | FK:teaching_assignments_institution_id_teacher_id_fkey, UNIQUE:teaching_assignments_teacher_id_group_id_academic_period_id_key | Docente |
| group_id | uuid | No | FK | FK:teaching_assignments_institution_id_group_id_academic_peri_fkey, UNIQUE:teaching_assignments_teacher_id_group_id_academic_period_id_key | Grupo académico |
| academic_period_id | uuid | No | FK | FK:teaching_assignments_institution_id_group_id_academic_peri_fkey, UNIQUE:teaching_assignments_institution_id_id_academic_period_id_key, UNIQUE:teaching_assignments_teacher_id_group_id_academic_period_id_key | Periodo académico |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

## user_roles

Roles de usuario por institución

| Campo | Tipo SQL | Nullable | PK/FK | Restricción/default | Descripción |
| --- | --- | --- | --- | --- | --- |
| id | uuid | No | PK | PK:user_roles_pkey; DEFAULT gen_random_uuid() | Identificador estable del registro |
| profile_id | uuid | No | FK | FK:user_roles_institution_id_profile_id_fkey, UNIQUE:user_roles_profile_id_role_id_institution_id_key | Perfil de usuario asociado |
| role_id | uuid | No | FK | UNIQUE:user_roles_profile_id_role_id_institution_id_key, FK:user_roles_role_id_fkey | Rol asignado |
| institution_id | uuid | No | FK | FK:user_roles_institution_id_fkey, FK:user_roles_institution_id_profile_id_fkey, UNIQUE:user_roles_profile_id_role_id_institution_id_key | Institución propietaria |
| created_at | timestamp with time zone | No |  | DEFAULT now() | Fecha de creación |

