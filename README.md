# SistemaCostenita
> **Sistema de Información y Gestión de Inventarios para Microempresa Apícola**  
> *Villa Montes, Tarija – Bolivia | Gestión 2026*[span_2](start_span)[span_2](end_span)

---

### 🍯 Sobre el Proyecto

**Costeñita** es un sistema de información web (MVP) diseñado para optimizar, estandarizar y transparentar la cadena de acopio, control de existencias y comercialización de miel y derivados apícolas en el Gran Chaco boliviano[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span). 

El software resuelve la desarticulación operativa tradicional mediante:
* **Acopio de Materia Prima por Peso (KG):** Recepción y liquidación de miel cruda a granel adquirida a apicultores locales[span_5](start_span)[span_5](end_span).
* **Descuento Cruzado de Inventario:** Conversión y deducción automática del stock de materia prima bruta ante la venta de presentaciones comerciales envasadas (250 g, 500 g, 1 kg)[span_6](start_span)[span_6](end_span).
* **Control Financiero en Moneda Nacional:** Valorización de inventarios y liquidaciones comerciales expresadas en Bolivianos (Bs.).
* **Blindaje Legal y Auditoría Inalterable:** Cumplimiento de la **Ley N° 164**, **CPE Art. 130 (Hábeas Data)** y **Código Penal Boliviano (Art. 363 bis/ter)** mediante registros de auditoría encadenados con SHA-256 y protección criptográfica (`pgcrypto`)[span_7](start_span)[span_7](end_span).

---

### 🎯 Impacto Socioambiental y ODS

Este proyecto se encuentra alineado con los Objetivos de Desarrollo Sostenible (CEPAL)[span_8](start_span)[span_8](end_span):
* **ODS 8 (Trabajo Decente y Crecimiento Económico):** Fomento al comercio justo y formalización operativa de los pequeños apicultores del Chaco[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span).
* **ODS 9 (Industria, Innovación e Infraestructura):** Digitalización de procesos productivos para microempresas locales[span_11](start_span)[span_11](end_span).
* **ODS 16 (Paz, Justicia e Instituciones Sólidas):** Transparencia, rendición de cuentas y trazabilidad inalterable de transacciones comerciales[span_12](start_span)[span_12](end_span).

---

### 🛠️ Stack Tecnológico

* **Frontend:** React + TypeScript + Vite + Tailwind CSS[span_13](start_span)[span_13](end_span).
* **Backend & Base de Datos:** Supabase / PostgreSQL (Diseño relacional en 3ra Forma Normal)[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span).
* **Seguridad:** Row Level Security (RLS), Extensiones `pgcrypto` y Triggers PL/pgSQL[span_16](start_span)[span_16](end_span).
* **Modelado & Diseño:** UML (PlantUML) y Prototipado UX/UI[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span).

---

### 👥 Equipo de Desarrollo

* **Ronny Guillermo Altamirano Suarez** — *Universidad Privada Domingo Savio (UPDS - Sede Tarija)*[span_19](start_span)[span_19](end_span)
* **Miguel Angel Lopez Villca** — *Universidad Privada Domingo Savio (UPDS - Sede Tarija)*[span_20](start_span)[span_20](end_span)
* **Docente Guía:** Ing. Nelson Huanca[span_21](start_span)[span_21](end_span)
* **Materia:** Sistemas de Información I[span_22](start_span)[span_22](end_span)
*
## Diagrama de Base de Datos

El siguiente diagrama representa la arquitectura de datos de Costeñita correspondiente al Split 1 (HU01–HU06), incluyendo las entidades, claves primarias, claves foráneas y relaciones entre las tablas.

![Diagrama de Base de Datos de Costeñita](docs/database/diagrama_base_datos_costenita.jpeg)
