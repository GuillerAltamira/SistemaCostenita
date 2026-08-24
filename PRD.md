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
- PRODUCTO (id_producto PK, nombre, presentacion, estado)
- PROVEEDOR (id_proveedor PK, nombre, telefono UNIQUE, localidad)
- COMPRA (id_compra PK, fecha, cantidad, unidad_medida, estado, id_proveedor FK, id_producto FK)
- INVENTARIO (id_inventario PK, stock_actual, unidad_medida, id_producto FK UNIQUE)
- MOVIMIENTO_INVENTARIO (id_movimiento PK, tipo, cantidad, fecha, id_producto FK)

### 4. Marco Legal Boliviano Citado
- Ley N° 830 (SENASAG): Inocuidad y trazabilidad obligatoria de apicultores en Villa Montes.
- Normas IBNORCA (NB 38001/2/4): Estándares de calidad y unidades de envasado (Kg, Litro).
- Código de Comercio (Decreto Ley N° 14379, Art. 36-65): Obligación de registro mercantil e inventarios inalterables.
- Ley N° 453: Información exacta al consumidor y veracidad en presentaciones.
- Ley N° 164: Validez legal de registros y datos informáticos.

### 5. Backlog MVP (Semana 1 & 2)
- HU01: Registrar Producto
- HU03: Registrar Proveedor (Apicultor)
- HU04: Registrar Compra de Miel (Afectación a Inventario)
- HU06: Registrar Entrada de Producto
- HU07: Registrar Salida de Producto (Validación de Stock)
- HU08: Consultar Inventario
- HU09: Registrar Venta
