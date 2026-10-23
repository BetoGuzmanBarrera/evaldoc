-- PR #23. Source: workbook Materias 189. Codes are internal, NOT official.
-- 54 names are plan-supported; 135 are proposals requiring verification. See docs.
-- Existing subjects and QA data are not updated or deleted.
create temp table pr23_subject_catalog (
 institution_slug text not null, institution_name text not null,
 campus_code text not null, campus_name text not null,
 program_code text not null, program_name text not null,
 subject_code text not null, subject_name text not null
);
insert into pr23_subject_catalog
 (institution_slug,institution_name,campus_code,campus_name,
  program_code,program_name,subject_code,subject_name)
values
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-1', 'Ingeniería Eléctrica', 'IPN-C1-P1-M1', 'Circuitos Eléctricos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-1', 'Ingeniería Eléctrica', 'IPN-C1-P1-M2', 'Máquinas Eléctricas'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-1', 'Ingeniería Eléctrica', 'IPN-C1-P1-M3', 'Sistemas Eléctricos de Potencia'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-2', 'Ingeniería en Comunicaciones y Electrónica', 'IPN-C1-P2-M1', 'Circuitos Electrónicos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-2', 'Ingeniería en Comunicaciones y Electrónica', 'IPN-C1-P2-M2', 'Señales y Sistemas'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-2', 'Ingeniería en Comunicaciones y Electrónica', 'IPN-C1-P2-M3', 'Comunicaciones Digitales'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-3', 'Ingeniería en Control y Automatización', 'IPN-C1-P3-M1', 'Control Automático'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-3', 'Ingeniería en Control y Automatización', 'IPN-C1-P3-M2', 'Instrumentación Industrial'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-1', 'ESIME Zacatenco', 'CAT-1-3', 'Ingeniería en Control y Automatización', 'IPN-C1-P3-M3', 'Automatización de Procesos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-1', 'Ingeniería Aeronáutica', 'IPN-C2-P1-M1', 'Aerodinámica'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-1', 'Ingeniería Aeronáutica', 'IPN-C2-P1-M2', 'Estructuras Aeronáuticas'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-1', 'Ingeniería Aeronáutica', 'IPN-C2-P1-M3', 'Propulsión Aeronáutica'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-2', 'Ingeniería Biotecnológica', 'IPN-C2-P2-M1', 'Microbiología'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-2', 'Ingeniería Biotecnológica', 'IPN-C2-P2-M2', 'Bioquímica'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-2', 'Ingeniería Biotecnológica', 'IPN-C2-P2-M3', 'Ingeniería de Bioprocesos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-3', 'Ingeniería en Sistemas Automotrices', 'IPN-C2-P3-M1', 'Mecánica Automotriz'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-3', 'Ingeniería en Sistemas Automotrices', 'IPN-C2-P3-M2', 'Sistemas Electrónicos Automotrices'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-2', 'UPIIG Campus Guanajuato', 'CAT-2-3', 'Ingeniería en Sistemas Automotrices', 'IPN-C2-P3-M3', 'Dinámica Vehicular'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-1', 'Ingeniería Ambiental', 'IPN-C3-P1-M1', 'Química Ambiental'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-1', 'Ingeniería Ambiental', 'IPN-C3-P1-M2', 'Tratamiento de Aguas'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-1', 'Ingeniería Ambiental', 'IPN-C3-P1-M3', 'Evaluación del Impacto Ambiental'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-2', 'Ingeniería en Alimentos', 'IPN-C3-P2-M1', 'Microbiología de Alimentos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-2', 'Ingeniería en Alimentos', 'IPN-C3-P2-M2', 'Tecnología de Conservación de Alimentos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-2', 'Ingeniería en Alimentos', 'IPN-C3-P2-M3', 'Análisis de Alimentos'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-3', 'Ingeniería en Inteligencia Artificial', 'IPN-C3-P3-M1', 'Programación'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-3', 'Ingeniería en Inteligencia Artificial', 'IPN-C3-P3-M2', 'Aprendizaje Automático'),
  ('ipn', 'Instituto Politécnico Nacional', 'CAT-3', 'UPIIZ Campus Zacatecas', 'CAT-3-3', 'Ingeniería en Inteligencia Artificial', 'IPN-C3-P3-M3', 'Redes Neuronales'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-1', 'Médico Cirujano', 'UNAM-C1-P1-M1', 'Anatomía'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-1', 'Médico Cirujano', 'UNAM-C1-P1-M2', 'Bioquímica y Biología Molecular'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-1', 'Médico Cirujano', 'UNAM-C1-P1-M3', 'Salud Pública I'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-2', 'Fisioterapia', 'UNAM-C1-P2-M1', 'Anatomía Funcional'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-2', 'Fisioterapia', 'UNAM-C1-P2-M2', 'Biomecánica'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-2', 'Fisioterapia', 'UNAM-C1-P2-M3', 'Fisioterapia Neurológica'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-3', 'Neurociencias', 'UNAM-C1-P3-M1', 'Neuroanatomía'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-3', 'Neurociencias', 'UNAM-C1-P3-M2', 'Neurofisiología'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-1', 'Ciudad Universitaria', 'CAT-1-3', 'Neurociencias', 'UNAM-C1-P3-M3', 'Neurobiología Celular'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-1', 'Actuaría', 'UNAM-C2-P1-M1', 'Cálculo Diferencial e Integral'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-1', 'Actuaría', 'UNAM-C2-P1-M2', 'Probabilidad'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-1', 'Actuaría', 'UNAM-C2-P1-M3', 'Matemáticas Actuariales'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-2', 'Relaciones Internacionales', 'UNAM-C2-P2-M1', 'Teoría de las Relaciones Internacionales'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-2', 'Relaciones Internacionales', 'UNAM-C2-P2-M2', 'Derecho Internacional Público'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-2', 'Relaciones Internacionales', 'UNAM-C2-P2-M3', 'Política Exterior de México'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-3', 'Ingeniería Civil', 'UNAM-C2-P3-M1', 'Estática'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-3', 'Ingeniería Civil', 'UNAM-C2-P3-M2', 'Cálculo Vectorial'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-2', 'FES Acatlán', 'CAT-2-3', 'Ingeniería Civil', 'UNAM-C2-P3-M3', 'Dibujo e Interpretación de Planos'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-1', 'Comunicación y Periodismo', 'UNAM-C3-P1-M1', 'Teorías de la Comunicación'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-1', 'Comunicación y Periodismo', 'UNAM-C3-P1-M2', 'Redacción Periodística'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-1', 'Comunicación y Periodismo', 'UNAM-C3-P1-M3', 'Producción Radiofónica'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-2', 'Derecho', 'UNAM-C3-P2-M1', 'Derecho Constitucional'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-2', 'Derecho', 'UNAM-C3-P2-M2', 'Derecho Civil'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-2', 'Derecho', 'UNAM-C3-P2-M3', 'Derecho Penal'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-3', 'Ingeniería en Computación', 'UNAM-C3-P3-M1', 'Programación'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-3', 'Ingeniería en Computación', 'UNAM-C3-P3-M2', 'Estructuras de Datos'),
  ('unam', 'Universidad Nacional Autónoma de México', 'CAT-3', 'FES Aragón', 'CAT-3-3', 'Ingeniería en Computación', 'UNAM-C3-P3-M3', 'Arquitectura de Computadoras'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-1', 'Comunicación y Medios Digitales', 'UVM-C1-P1-M1', 'Taller de redacción'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-1', 'Comunicación y Medios Digitales', 'UVM-C1-P1-M2', 'Modelos teóricos de comunicación'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-1', 'Comunicación y Medios Digitales', 'UVM-C1-P1-M3', 'Guionismo y narrativa audiovisual'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-2', 'Psicología', 'UVM-C1-P2-M1', 'Introducción a la Psicología'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-2', 'Psicología', 'UVM-C1-P2-M2', 'Psicología del Desarrollo'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-2', 'Psicología', 'UVM-C1-P2-M3', 'Evaluación Psicológica'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-3', 'Economía y Finanzas', 'UVM-C1-P3-M1', 'Microeconomía'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-3', 'Economía y Finanzas', 'UVM-C1-P3-M2', 'Matemáticas Financieras'),
  ('uvm', 'Universidad del Valle de México', 'CAT-1', 'Reforma – San Rafael', 'CAT-1-3', 'Economía y Finanzas', 'UVM-C1-P3-M3', 'Macroeconomía'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-1', 'Ingeniería Biomédica', 'UVM-C2-P1-M1', 'Anatomía y Fisiología'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-1', 'Ingeniería Biomédica', 'UVM-C2-P1-M2', 'Bioinstrumentación'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-1', 'Ingeniería Biomédica', 'UVM-C2-P1-M3', 'Ingeniería Clínica'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-2', 'Medicina Veterinaria y Zootecnia', 'UVM-C2-P2-M1', 'Anatomía Veterinaria'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-2', 'Medicina Veterinaria y Zootecnia', 'UVM-C2-P2-M2', 'Fisiología Animal'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-2', 'Medicina Veterinaria y Zootecnia', 'UVM-C2-P2-M3', 'Microbiología Veterinaria'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-3', 'Fisioterapia', 'UVM-C2-P3-M1', 'Anatomía Humana'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-3', 'Fisioterapia', 'UVM-C2-P3-M2', 'Biomecánica'),
  ('uvm', 'Universidad del Valle de México', 'CAT-2', 'Coyoacán – Tlalpan', 'CAT-2-3', 'Fisioterapia', 'UVM-C2-P3-M3', 'Fisioterapia Musculoesquelética'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-1', 'Ingeniería en Ciencia de Datos', 'UVM-C3-P1-M1', 'Programación en Python'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-1', 'Ingeniería en Ciencia de Datos', 'UVM-C3-P1-M2', 'Estadística Aplicada'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-1', 'Ingeniería en Ciencia de Datos', 'UVM-C3-P1-M3', 'Minería de Datos'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-2', 'Ingeniería en Desarrollo de Videojuegos', 'UVM-C3-P2-M1', 'Fundamentos del diseño y la composición para videojuegos'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-2', 'Ingeniería en Desarrollo de Videojuegos', 'UVM-C3-P2-M2', 'Física'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-2', 'Ingeniería en Desarrollo de Videojuegos', 'UVM-C3-P2-M3', 'Estructuras narrativas para videojuegos'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-3', 'Ingeniería en Robótica', 'UVM-C3-P3-M1', 'Mecatrónica'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-3', 'Ingeniería en Robótica', 'UVM-C3-P3-M2', 'Control de Robots'),
  ('uvm', 'Universidad del Valle de México', 'CAT-3', 'Monterrey Cumbres', 'CAT-3-3', 'Ingeniería en Robótica', 'UVM-C3-P3-M3', 'Sensores y Actuadores'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-1', 'Arquitectura', 'TEC-C1-P1-M1', 'Diseño Arquitectónico'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-1', 'Arquitectura', 'TEC-C1-P1-M2', 'Sistemas Estructurales'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-1', 'Arquitectura', 'TEC-C1-P1-M3', 'Construcción Sustentable'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-2', 'Ingeniería Biomédica', 'TEC-C1-P2-M1', 'Fisiología Humana'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-2', 'Ingeniería Biomédica', 'TEC-C1-P2-M2', 'Instrumentación Biomédica'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-2', 'Ingeniería Biomédica', 'TEC-C1-P2-M3', 'Procesamiento de Señales Biomédicas'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-3', 'Ingeniería en Nanotecnología', 'TEC-C1-P3-M1', 'Química de materiales y nanomateriales'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-3', 'Ingeniería en Nanotecnología', 'TEC-C1-P3-M2', 'Mecánica cuántica para nanotecnología'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-1', 'Campus Monterrey', 'CAT-1-3', 'Ingeniería en Nanotecnología', 'TEC-C1-P3-M3', 'Técnicas de caracterización de materiales'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-1', 'Ingeniería en Transformación Digital de Negocios', 'TEC-C2-P1-M1', 'Fundamentos de programación'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-1', 'Ingeniería en Transformación Digital de Negocios', 'TEC-C2-P1-M2', 'Arquitectura y uso de datos'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-1', 'Ingeniería en Transformación Digital de Negocios', 'TEC-C2-P1-M3', 'Gestión de proyectos de TI'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-2', 'Comunicación y Producción Digital', 'TEC-C2-P2-M1', 'Producción Audiovisual'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-2', 'Comunicación y Producción Digital', 'TEC-C2-P2-M2', 'Narrativas Digitales'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-2', 'Comunicación y Producción Digital', 'TEC-C2-P2-M3', 'Comunicación Estratégica'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-3', 'Derecho', 'TEC-C2-P3-M1', 'Derecho Constitucional'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-3', 'Derecho', 'TEC-C2-P3-M2', 'Derecho Mercantil'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-2', 'Campus Santa Fe', 'CAT-2-3', 'Derecho', 'TEC-C2-P3-M3', 'Derecho Penal'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-1', 'Mercadotecnia', 'TEC-C3-P1-M1', 'Investigación de Mercados'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-1', 'Mercadotecnia', 'TEC-C3-P1-M2', 'Comportamiento del Consumidor'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-1', 'Mercadotecnia', 'TEC-C3-P1-M3', 'Marketing Digital'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-2', 'Finanzas', 'TEC-C3-P2-M1', 'Dirección financiera'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-2', 'Finanzas', 'TEC-C3-P2-M2', 'Econometría financiera'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-2', 'Finanzas', 'TEC-C3-P2-M3', 'Finanzas corporativas'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-3', 'Diseño', 'TEC-C3-P3-M1', 'Pensamiento de Diseño'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-3', 'Diseño', 'TEC-C3-P3-M2', 'Diseño de Productos'),
  ('tecnologico-de-monterrey', 'Tecnológico de Monterrey', 'CAT-3', 'Campus Guadalajara', 'CAT-3-3', 'Diseño', 'TEC-C3-P3-M3', 'Prototipado Digital'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-1', 'Ingeniería Ambiental', 'UAM-C1-P1-M1', 'Química Ambiental'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-1', 'Ingeniería Ambiental', 'UAM-C1-P1-M2', 'Evaluación de Impacto Ambiental'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-1', 'Ingeniería Ambiental', 'UAM-C1-P1-M3', 'Plantas de Tratamiento de Aguas Residuales'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-2', 'Arquitectura', 'UAM-C1-P2-M1', 'Diseño Arquitectónico'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-2', 'Arquitectura', 'UAM-C1-P2-M2', 'Construcción'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-2', 'Arquitectura', 'UAM-C1-P2-M3', 'Sistemas Estructurales'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-3', 'Derecho', 'UAM-C1-P3-M1', 'Teoría del Derecho'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-3', 'Derecho', 'UAM-C1-P3-M2', 'Derecho Constitucional'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-1', 'Unidad Azcapotzalco', 'CAT-1-3', 'Derecho', 'UAM-C1-P3-M3', 'Derecho Civil'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-1', 'Computación', 'UAM-C2-P1-M1', 'Fundamentos de Programación'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-1', 'Computación', 'UAM-C2-P1-M2', 'Matemáticas Discretas I'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-1', 'Computación', 'UAM-C2-P1-M3', 'Introducción a la Computación'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-2', 'Ingeniería Biomédica', 'UAM-C2-P2-M1', 'Bioinstrumentación'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-2', 'Ingeniería Biomédica', 'UAM-C2-P2-M2', 'Señales Biomédicas'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-2', 'Ingeniería Biomédica', 'UAM-C2-P2-M3', 'Ingeniería Clínica'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-3', 'Antropología Social', 'UAM-C2-P3-M1', 'Teoría Antropológica'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-3', 'Antropología Social', 'UAM-C2-P3-M2', 'Etnografía'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-2', 'Unidad Iztapalapa', 'CAT-2-3', 'Antropología Social', 'UAM-C2-P3-M3', 'Antropología de México'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-1', 'Agronomía', 'UAM-C3-P1-M1', 'La Sustentabilidad de los Sistemas Agrícolas'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-1', 'Agronomía', 'UAM-C3-P1-M2', 'Interacciones Bióticas en los Sistemas Agrícolas'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-1', 'Agronomía', 'UAM-C3-P1-M3', 'Innovación Tecnológica en la Agricultura'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-2', 'Estomatología', 'UAM-C3-P2-M1', 'Salud Bucal'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-2', 'Estomatología', 'UAM-C3-P2-M2', 'Práctica Clínica Estomatológica I'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-2', 'Estomatología', 'UAM-C3-P2-M3', 'Anatomía y Fisiología en el Diagnóstico y Manejo Clínico'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-3', 'Comunicación Social', 'UAM-C3-P3-M1', 'Comunicación y Sociedad'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-3', 'Comunicación Social', 'UAM-C3-P3-M2', 'Procesos de Comunicación'),
  ('uam', 'Universidad Autónoma Metropolitana', 'CAT-3', 'Unidad Xochimilco', 'CAT-3-3', 'Comunicación Social', 'UAM-C3-P3-M3', 'Investigación en Comunicación'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-1', 'Ingeniería en Inteligencia Artificial', 'IBERO-C1-P1-M1', 'Programación'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-1', 'Ingeniería en Inteligencia Artificial', 'IBERO-C1-P1-M2', 'Aprendizaje Automático'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-1', 'Ingeniería en Inteligencia Artificial', 'IBERO-C1-P1-M3', 'Fundamentos de Inteligencia Artificial'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-2', 'Psicología', 'IBERO-C1-P2-M1', 'Bases Biológicas del Comportamiento'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-2', 'Psicología', 'IBERO-C1-P2-M2', 'Teorías de la Personalidad'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-2', 'Psicología', 'IBERO-C1-P2-M3', 'Métodos de Investigación en Psicología I'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-3', 'Ingeniería Civil', 'IBERO-C1-P3-M1', 'Cálculo I y Taller'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-3', 'Ingeniería Civil', 'IBERO-C1-P3-M2', 'Física 1'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-1', 'Ciudad de México', 'CAT-1-3', 'Ingeniería Civil', 'IBERO-C1-P3-M3', 'Introducción a la Ingeniería Civil'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-1', 'Arquitectura', 'IBERO-C2-P1-M1', 'Diseño Arquitectónico'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-1', 'Arquitectura', 'IBERO-C2-P1-M2', 'Historia de la Arquitectura'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-1', 'Arquitectura', 'IBERO-C2-P1-M3', 'Sistemas Constructivos'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-2', 'Ingeniería Automotriz', 'IBERO-C2-P2-M1', 'Introducción a la Ingeniería y Tecnología Automotriz'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-2', 'Ingeniería Automotriz', 'IBERO-C2-P2-M2', 'Dibujo por Computadora I'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-2', 'Ingeniería Automotriz', 'IBERO-C2-P2-M3', 'Laboratorio de Programación'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-3', 'Derecho', 'IBERO-C2-P3-M1', 'Derecho Constitucional'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-3', 'Derecho', 'IBERO-C2-P3-M2', 'Teoría General del Proceso'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-2', 'Puebla', 'CAT-2-3', 'Derecho', 'IBERO-C2-P3-M3', 'Derecho Civil'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-1', 'Marketing y Publicidad', 'IBERO-C3-P1-M1', 'Fundamentos de Marketing'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-1', 'Marketing y Publicidad', 'IBERO-C3-P1-M2', 'Investigación de Mercados'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-1', 'Marketing y Publicidad', 'IBERO-C3-P1-M3', 'Publicidad Digital'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-2', 'Comunicación', 'IBERO-C3-P2-M1', 'Teorías de la Comunicación'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-2', 'Comunicación', 'IBERO-C3-P2-M2', 'Producción Audiovisual'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-2', 'Comunicación', 'IBERO-C3-P2-M3', 'Periodismo'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-3', 'Nutrición y Ciencia de los Alimentos', 'IBERO-C3-P3-M1', 'Cultura alimentaria'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-3', 'Nutrición y Ciencia de los Alimentos', 'IBERO-C3-P3-M2', 'Fisiología celular'),
  ('universidad-iberoamericana', 'Universidad Iberoamericana', 'CAT-3', 'León', 'CAT-3-3', 'Nutrición y Ciencia de los Alimentos', 'IBERO-C3-P3-M3', 'Introducción a la Nutrición y Ciencia de los Alimentos'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-1', 'Biotecnología', 'ANAHUAC-C1-P1-M1', 'Química general'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-1', 'Biotecnología', 'ANAHUAC-C1-P1-M2', 'Bioquímica general'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-1', 'Biotecnología', 'ANAHUAC-C1-P1-M3', 'Microbiología general'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-2', 'Médico Cirujano Dentista', 'ANAHUAC-C1-P2-M1', 'Anatomía de Cabeza y Cuello'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-2', 'Médico Cirujano Dentista', 'ANAHUAC-C1-P2-M2', 'Histología Bucal'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-2', 'Médico Cirujano Dentista', 'ANAHUAC-C1-P2-M3', 'Odontología Preventiva'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-3', 'Artes Visuales', 'ANAHUAC-C1-P3-M1', 'Dibujo'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-3', 'Artes Visuales', 'ANAHUAC-C1-P3-M2', 'Historia del Arte'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-1', 'México Campus Norte', 'CAT-1-3', 'Artes Visuales', 'ANAHUAC-C1-P3-M3', 'Técnicas Pictóricas'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-1', 'Administración y Dirección de Empresas', 'ANAHUAC-C2-P1-M1', 'Introducción a la Administración'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-1', 'Administración y Dirección de Empresas', 'ANAHUAC-C2-P1-M2', 'Contabilidad Financiera'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-1', 'Administración y Dirección de Empresas', 'ANAHUAC-C2-P1-M3', 'Planeación Estratégica'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-2', 'Dirección Financiera', 'ANAHUAC-C2-P2-M1', 'Taller de Finanzas Personales'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-2', 'Dirección Financiera', 'ANAHUAC-C2-P2-M2', 'Fundamentos de Contabilidad'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-2', 'Dirección Financiera', 'ANAHUAC-C2-P2-M3', 'Matemáticas Financieras'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-3', 'Economía', 'ANAHUAC-C2-P3-M1', 'Microeconomía'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-3', 'Economía', 'ANAHUAC-C2-P3-M2', 'Macroeconomía'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-2', 'México Campus Sur', 'CAT-2-3', 'Economía', 'ANAHUAC-C2-P3-M3', 'Econometría'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-1', 'Arquitectura', 'ANAHUAC-C3-P1-M1', 'Diseño Arquitectónico'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-1', 'Arquitectura', 'ANAHUAC-C3-P1-M2', 'Dibujo Arquitectónico'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-1', 'Arquitectura', 'ANAHUAC-C3-P1-M3', 'Tecnología de la Construcción'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-2', 'Ingeniería Mecánica para la Innovación', 'ANAHUAC-C3-P2-M1', 'Cálculo diferencial'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-2', 'Ingeniería Mecánica para la Innovación', 'ANAHUAC-C3-P2-M2', 'Cálculo integral'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-2', 'Ingeniería Mecánica para la Innovación', 'ANAHUAC-C3-P2-M3', 'Álgebra lineal'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-3', 'Turismo Internacional', 'ANAHUAC-C3-P3-M1', 'Geografía Turística'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-3', 'Turismo Internacional', 'ANAHUAC-C3-P3-M2', 'Gestión de Empresas Turísticas'),
  ('universidad-anahuac', 'Universidad Anáhuac', 'CAT-3', 'Anáhuac Querétaro', 'CAT-3-3', 'Turismo Internacional', 'ANAHUAC-C3-P3-M3', 'Patrimonio Cultural');

do $guard$
begin
 if (select count(*) from pr23_subject_catalog)<>189
   or (select count(distinct institution_slug) from pr23_subject_catalog)<>7
   or (select count(distinct (institution_slug,campus_code)) from pr23_subject_catalog)<>21
   or (select count(distinct (institution_slug,campus_code,program_code)) from pr23_subject_catalog)<>63
   or exists (select 1 from pr23_subject_catalog
     group by institution_slug,campus_code,program_code having count(*)<>3)
   or exists (select 1 from pr23_subject_catalog
     group by institution_slug,subject_code having count(*)<>1)
 then raise exception 'PR23 invalid source cardinality or duplicate internal codes'; end if;
 if (select count(*) from pr23_subject_catalog x
   join public.institutions i on i.slug=x.institution_slug and i.name=x.institution_name and i.active
   join public.campuses c on c.institution_id=i.id and c.code=x.campus_code and c.name=x.campus_name and c.active
   join public.programs p on p.institution_id=i.id and p.campus_id=c.id
     and p.code=x.program_code and p.name=x.program_name and p.active and p.catalog_visible)<>189
 then raise exception 'PR23 institution, campus or program mapping changed'; end if;
 if exists (select 1 from pr23_subject_catalog x
   join public.institutions i on i.slug=x.institution_slug
   join public.subjects s on s.institution_id=i.id
     and (s.code=x.subject_code or s.name=x.subject_name)
   join public.programs p on p.id=s.program_id
   where s.code<>x.subject_code or s.name<>x.subject_name
      or p.code<>x.program_code or p.institution_id<>i.id)
 then raise exception 'PR23 existing subject conflicts with catalog'; end if;
end
$guard$;

insert into public.subjects (institution_id,program_id,code,name)
select i.id,p.id,x.subject_code,x.subject_name
from pr23_subject_catalog x
join public.institutions i on i.slug=x.institution_slug
join public.campuses c on c.institution_id=i.id and c.code=x.campus_code
join public.programs p on p.institution_id=i.id and p.campus_id=c.id and p.code=x.program_code
order by x.institution_slug,x.campus_code,x.program_code,x.subject_code
on conflict (institution_id,code) do nothing;

do $verify$
begin
 if (select count(*) from pr23_subject_catalog x
   join public.institutions i on i.slug=x.institution_slug
   join public.campuses c on c.institution_id=i.id and c.code=x.campus_code
   join public.programs p on p.institution_id=i.id and p.campus_id=c.id and p.code=x.program_code
   join public.subjects s on s.institution_id=i.id and s.program_id=p.id
     and s.code=x.subject_code and s.name=x.subject_name and s.active)<>189
 then raise exception 'PR23 catalog insertion incomplete'; end if;
end
$verify$;
drop table pr23_subject_catalog;
