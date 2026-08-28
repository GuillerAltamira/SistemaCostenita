# Documento de Requerimientos de Producto (PRD)
## Sistema de Gestión de Información y Control de Inventarios — Microempresa "Costeñita"

**Información del Documento:**
- **Proyecto:** Sistematización de la gestión de información de la microempresa Costeñita
- **Versión:** 1.0 (MVP)
- **Fecha:** Agosto 2026
- **Ubicación:** Villa Montes / Tarija, Bolivia
- **Autores:** Ronny Guillermo Altamirano Suarez, Miguel Angel Lopez Villca
- **Institución:** Universidad Privada Domingo Savio (UPDS) — Facultad de Ingenierías (Docente: Ing. Nelson Huanca)
- **Repositorio:** https://github.com/GuillerAltamira/SistemaCostenita.git

---

### 1. Resumen Ejecutivo y Visión
Costeñita es una microempresa en Villa Montes dedicada al acopio y comercialización de miel de abeja. Trasladará sus registros manuales en 
cuadernos a una plataforma digital que centralice compras, productos, inventario y ventas, eliminando inconsistencias de cálculo y asegurando la trazabilidad apícola.

### 2. Stack Tecnológico
- Frontend: React 19 + TypeScript + Tailwind CSS
- Backend/Servicios: Express REST API con patrón Controller-Repository
- Base de Datos: Motor SQL Relacional Normalizado en 3FN (PostgreSQL / MySQL)

### 3. Modelo de Datos Normalizado (5 Tablas)
- PRODUCTO (id_producto PK, nombre, presentacion, estado) — *Presentaciones expresadas en peso (ej. 250 g, 500 g, 1 kg, Balde 25 kg)*
- PROVEEDOR (id_proveedor PK, nombre, telefono UNIQUE, localidad)
- COMPRA (id_compra PK, fecha, cantidad, unidad_medida, estado, id_proveedor FK, id_producto FK) — *Unidades permitidas: ('GRAMOS', 'KG', 'UNIDAD')*
- INVENTARIO (id_inventario PK, stock_actual, unidad_medida, id_producto FK UNIQUE) — *Unidades permitidas: ('GRAMOS', 'KG', 'UNIDAD')*
- MOVIMIENTO_INVENTARIO (id_movimiento PK, tipo, cantidad, unidad_medida, fecha, id_producto FK) — *Unidades permitidas: ('GRAMOS', 'KG', 'UNIDAD')*
*Nota técnica:* La miel y sus derivados se gestionan exclusivamente por peso, no por volumen.

### 4. Marco Legal Boliviano Citado
- Ley N° 830 (SENASAG): Inocuidad y trazabilidad obligatoria de apicultores en Villa Montes.
- Normas IBNORCA (NB 38001/2/4): Estándares de calidad y unidades de envasado estandarizadas por peso (Gramos y Kilogramos).
- Código de Comercio (Decreto Ley N° 14379, Art. 36-65): Obligación de registro mercantil e inventarios inalterables.
- Ley N° 453: Información exacta al consumidor y veracidad en presentaciones en masa/peso neto.
- Ley N° 164: Validez legal de registros y datos informáticos.

### 5. Backlog MVP (Semana 1 & 2)
- HU01: Registrar Producto
- HU03: Registrar Proveedor (Apicultor)
- HU04: Registrar Compra de Miel (Afectación a Inventario)
- HU06: Registrar Entrada de Producto
- HU07: Registrar Salida de Producto (Validación de Stock)
- HU08: Consultar Inventario
- HU09: Registrar Venta

## 6. Marco Legal y Ética de Datos

### 6.1. Derecho al Habeas Data (CPE Art. 130)
* **Acceso y Rectificación:** Los usuarios (responsables, apicultores y clientes) tienen derecho a visualizar y modificar la exactitud de sus datos de contacto y transacciones registradas.
* **Supresión / Anonimización:** Se implementa borrado lógico (`is_deleted = true`) y disociación de datos sensibles (anonimización de teléfonos y nombres) cuando se requiere la baja, garantizando la preservación de históricos contables.

### 6.2. Cumplimiento de la Ley General de Telecomunicaciones y TIC (Ley N° 164)
* **Estándares Abiertos:** El sistema utiliza esquemas de intercambio e interfaces basadas en formatos abiertos (JSON, PostgreSQL, REST) garantizando interoperabilidad tecnológica.
* **Validez de Transacciones y Documentos Digitales:** La trazabilidad de transacciones de compra y venta queda registrada con identificador de sesión y marcas temporales auditables, preparando la integración con firma digital según el Art. 78 de la Ley 164.

### 6.3. Seguridad de la Información, Código Penal y Directrices Financieras (ASFI / Art. 363 ter)
* **Protección contra Acceso Indebido (Código Penal Art. 363 ter):** Se implementa autenticación mediante Supabase Auth y políticas de seguridad a nivel de fila (Row Level Security - RLS) para restringir accesos anónimos indebidos.
* **Logs de Auditoría Inalterables Encadenados (Normativa ASFI Libro 3° Tít. VII / Ley 164 Art. 79):** Registro automático en la tabla `logs_auditoria` para todas las operaciones DML (`INSERT`, `UPDATE`, `DELETE`), almacenando `tabla_afectada`, `operacion`, `usuario_id`, `datos_anteriores`, `datos_nuevos`, `hash_anterior`, `hash_integridad` (SHA-256) y `timestamp`. La modificación o eliminación de logs está físicamente denegada por triggers de base de datos (`trg_bloquear_alteracion_auditoria`).
* **Cifrado de Datos en Reposo y en Tránsito:** Tránsito cifrado TLS 1.3 y cifrado simétrico en reposo mediante la extensión `pgcrypto` (`fn_cifrar_texto` / `fn_descifrar_texto`) para resguardar números de teléfono y datos personales de apicultores (PII).
