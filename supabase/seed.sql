-- ==============================================================================
-- SISTEMA COSTEÑITA — Datos Iniciales de Prueba (Seed Data)
-- Microempresa Apícola Costeñita — Villa Montes, Tarija, Bolivia
-- ==============================================================================

-- 1. Insertar Proveedores / Apicultores de la región Chaqueña con teléfonos cifrados
INSERT INTO proveedor (nombre, telefono, localidad) VALUES
('Don Mateo Benítez (Apicultor El Palmar)', fn_cifrar_texto('72981234'), 'El Palmar - Villa Montes'),
('Asociación de Apicultores Pilcomayo (ASOAPI)', fn_cifrar_texto('71894562'), 'Ibibobo - Gran Chaco'),
('Doña Carmen Baldiviezo (Finca La Floresta)', fn_cifrar_texto('76123984'), 'Tarairí - Villa Montes'),
('Sr. Victoriano Ramos', fn_cifrar_texto('73456789'), 'Caigua - Villa Montes'),
('Cooperativa Apícola Chaqueña Ltda.', fn_cifrar_texto('75128493'), 'Puesto Uno - Villa Montes')
ON CONFLICT (telefono) DO NOTHING;

-- 2. Insertar Productos de Miel y Derivados (Expresados estrictamente en Peso: Gramos y Kilos)
INSERT INTO producto (nombre, presentacion, estado) VALUES
('Miel de Monte Chaqueño Pura', 'Frasco de Vidrio 1 kg', 'ACTIVO'),
('Miel de Monte Chaqueño Pura', 'Frasco de Vidrio 500 g', 'ACTIVO'),
('Miel de Monte Chaqueño Pura', 'Envase PET 1 kg', 'ACTIVO'),
('Miel de Flores Silvestres', 'Frasco 250 g', 'ACTIVO'),
('Miel a Granel para Envasado', 'Balde Hermético 25 kg', 'ACTIVO'),
('Propóleo Concentrado en Gotero', 'Frasco Gotero 30 g', 'ACTIVO'),
('Polen Seco de Miel de Chaco', 'Frasco 200 g', 'ACTIVO')
ON CONFLICT (nombre, presentacion) DO NOTHING;

-- 3. Inicializar / Actualizar Stock en Inventario (Unidades permitidas: 'GRAMOS', 'KG', 'UNIDAD')
UPDATE inventario SET stock_actual = 85, unidad_medida = 'UNIDAD' WHERE id_producto = 1;
UPDATE inventario SET stock_actual = 120, unidad_medida = 'UNIDAD' WHERE id_producto = 2;
UPDATE inventario SET stock_actual = 45, unidad_medida = 'UNIDAD' WHERE id_producto = 3;
UPDATE inventario SET stock_actual = 60, unidad_medida = 'UNIDAD' WHERE id_producto = 4;
UPDATE inventario SET stock_actual = 12, unidad_medida = 'UNIDAD' WHERE id_producto = 5;
UPDATE inventario SET stock_actual = 35, unidad_medida = 'UNIDAD' WHERE id_producto = 6;
UPDATE inventario SET stock_actual = 20, unidad_medida = 'UNIDAD' WHERE id_producto = 7;

-- 4. Movimientos iniciales de entrada
INSERT INTO movimiento_inventario (id_producto, tipo, cantidad, unidad_medida, fecha, motivo) VALUES
(1, 'ENTRADA', 100, 'UNIDAD', CURRENT_DATE - INTERVAL '10 days', 'Lote de envasado inicial C-001'),
(1, 'SALIDA', 15, 'UNIDAD', CURRENT_DATE - INTERVAL '3 days', 'Ventas a tiendas locales Villa Montes'),
(2, 'ENTRADA', 150, 'UNIDAD', CURRENT_DATE - INTERVAL '8 days', 'Lote de envasado C-002'),
(2, 'SALIDA', 30, 'UNIDAD', CURRENT_DATE - INTERVAL '2 days', 'Ventas ferias gastronómicas Tarija'),
(5, 'ENTRADA', 15, 'KG', CURRENT_DATE - INTERVAL '5 days', 'Acopio directo Don Mateo Benitez');

-- 5. Compras iniciales (Acopio por peso en KG)
INSERT INTO compra (fecha, cantidad, unidad_medida, estado, id_proveedor, id_producto, precio_unitario, total, observaciones) VALUES
(CURRENT_DATE - INTERVAL '5 days', 15, 'KG', 'REGISTRADA', 1, 5, 28.00, 420.00, 'Miel de monte cosechada en floración de algarrobo y quebracho'),
(CURRENT_DATE - INTERVAL '12 days', 50, 'KG', 'REGISTRADA', 2, 1, 26.50, 1325.00, 'Lote certificado por SENASAG con sello de origen Pilcomayo'),
(CURRENT_DATE - INTERVAL '20 days', 30, 'KG', 'REGISTRADA', 3, 2, 27.00, 810.00, 'Acopio primera cosecha estación');
