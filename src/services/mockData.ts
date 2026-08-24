import { Producto, Proveedor, Inventario, Compra, MovimientoInventario, Venta } from '../types/models';

export const INITIAL_PRODUCTOS: Producto[] = [
  {
    id_producto: 1,
    nombre: 'Miel de Monte Chaqueño Pura',
    presentacion: 'Frasco de Vidrio 1 kg',
    precio_venta: 45.00,
    descripcion: 'Miel pura 100% natural recolectada en floración de algarrobo y quebracho colorado en Villa Montes.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 2,
    nombre: 'Miel de Monte Chaqueño Pura',
    presentacion: 'Frasco de Vidrio 500 g',
    precio_venta: 28.00,
    descripcion: 'Frasco mediano ideal para consumo familiar, sabor intenso característico del bosque seco chaqueño.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 3,
    nombre: 'Miel de Monte Chaqueño Pura',
    presentacion: 'Envase PET 1 kg',
    precio_venta: 42.00,
    descripcion: 'Envase liviano e irrompible con pico dosificador para fácil manipulación.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 4,
    nombre: 'Miel de Flores Silvestres',
    presentacion: 'Frasco 250 g',
    precio_venta: 18.00,
    descripcion: 'Miel clara y suave de floración primaveral de las riberas del río Pilcomayo.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 5,
    nombre: 'Miel a Granel para Envasado',
    presentacion: 'Balde Hermético 25 kg',
    precio_venta: 650.00,
    descripcion: 'Materia prima acopiada para fraccionamiento, repostería o distribución comercial mayorista.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 6,
    nombre: 'Propóleo Concentrado en Gotero',
    presentacion: 'Frasco Gotero 30 g',
    precio_venta: 25.00,
    descripcion: 'Extracto hidroalcohólico de propóleo chaqueño con propiedades antimicrobianas e inmunológicas.',
    estado: 'ACTIVO'
  },
  {
    id_producto: 7,
    nombre: 'Polen Seco de Miel de Chaco',
    presentacion: 'Frasco 200 g',
    precio_venta: 35.00,
    descripcion: 'Polen apícola multicolor deshidratado a baja temperatura, alto en aminoácidos y proteínas.',
    estado: 'ACTIVO'
  }
];

export const INITIAL_PROVEEDORES: Proveedor[] = [
  { id_proveedor: 1, nombre: 'Don Mateo Benítez (El Palmar)', telefono: '72981234', localidad: 'El Palmar - Villa Montes' },
  { id_proveedor: 2, nombre: 'Asociación Apícola Pilcomayo (ASOAPI)', telefono: '71894562', localidad: 'Ibibobo - Gran Chaco' },
  { id_proveedor: 3, nombre: 'Doña Carmen Baldiviezo (Finca La Floresta)', telefono: '76123984', localidad: 'Tarairí - Villa Montes' },
  { id_proveedor: 4, nombre: 'Sr. Victoriano Ramos', telefono: '73456789', localidad: 'Caigua - Villa Montes' },
  { id_proveedor: 5, nombre: 'Cooperativa Apícola Chaqueña Ltda.', telefono: '75128493', localidad: 'Puesto Uno - Villa Montes' }
];

export const INITIAL_INVENTARIO: Inventario[] = [
  { id_inventario: 1, id_producto: 1, stock_actual: 85, unidad_medida: 'UNIDAD' },
  { id_inventario: 2, id_producto: 2, stock_actual: 120, unidad_medida: 'UNIDAD' },
  { id_inventario: 3, id_producto: 3, stock_actual: 45, unidad_medida: 'UNIDAD' },
  { id_inventario: 4, id_producto: 4, stock_actual: 60, unidad_medida: 'UNIDAD' },
  { id_inventario: 5, id_producto: 5, stock_actual: 12, unidad_medida: 'UNIDAD' },
  { id_inventario: 6, id_producto: 6, stock_actual: 35, unidad_medida: 'UNIDAD' },
  { id_inventario: 7, id_producto: 7, stock_actual: 20, unidad_medida: 'UNIDAD' }
];

export const INITIAL_COMPRAS: Compra[] = [
  {
    id_compra: 1,
    fecha: '2026-08-18',
    cantidad: 15,
    unidad_medida: 'KG',
    estado: 'REGISTRADA',
    id_proveedor: 1,
    id_producto: 5,
    precio_unitario: 28,
    total: 420,
    observaciones: 'Miel de monte cosechada en floración de algarrobo y quebracho'
  },
  {
    id_compra: 2,
    fecha: '2026-08-12',
    cantidad: 50,
    unidad_medida: 'KG',
    estado: 'REGISTRADA',
    id_proveedor: 2,
    id_producto: 1,
    precio_unitario: 26.5,
    total: 1325,
    observaciones: 'Lote certificado por SENASAG con sello de origen Pilcomayo'
  },
  {
    id_compra: 3,
    fecha: '2026-08-04',
    cantidad: 30,
    unidad_medida: 'KG',
    estado: 'REGISTRADA',
    id_proveedor: 3,
    id_producto: 2,
    precio_unitario: 27,
    total: 810,
    observaciones: 'Acopio primera cosecha estación'
  }
];

export const INITIAL_MOVIMIENTOS: MovimientoInventario[] = [
  { id_movimiento: 1, id_producto: 1, tipo: 'ENTRADA', cantidad: 100, fecha: '2026-08-14', motivo: 'Lote de envasado inicial C-001' },
  { id_movimiento: 2, id_producto: 1, tipo: 'SALIDA', cantidad: 15, fecha: '2026-08-21', motivo: 'Ventas a tiendas locales Villa Montes' },
  { id_movimiento: 3, id_producto: 2, tipo: 'ENTRADA', cantidad: 150, fecha: '2026-08-16', motivo: 'Lote de envasado C-002' },
  { id_movimiento: 4, id_producto: 2, tipo: 'SALIDA', cantidad: 30, fecha: '2026-08-22', motivo: 'Ventas ferias gastronómicas Tarija' },
  { id_movimiento: 5, id_producto: 5, tipo: 'ENTRADA', cantidad: 15, fecha: '2026-08-18', motivo: 'Acopio directo Don Mateo Benitez' }
];

export const INITIAL_VENTAS: Venta[] = [
  { id_venta: 1, fecha: '2026-08-21', cliente: 'Supermercado Chaqueño', id_producto: 1, cantidad: 15, precio_unitario: 45, total: 675, estado: 'COMPLETADA' },
  { id_venta: 2, fecha: '2026-08-22', cliente: 'Feria Villa Montes', id_producto: 2, cantidad: 30, precio_unitario: 28, total: 840, estado: 'COMPLETADA' },
  { id_venta: 3, fecha: '2026-08-23', cliente: 'Farmacia Naturalis', id_producto: 6, cantidad: 10, precio_unitario: 25, total: 250, estado: 'COMPLETADA' }
];

export function checkAndMigrateLocalStorage() {
  const CURRENT_VERSION = 'v3_hu01_precios_descripcion';
  const savedVersion = localStorage.getItem('costenita_db_version');
  if (savedVersion !== CURRENT_VERSION) {
    localStorage.setItem('costenita_productos', JSON.stringify(INITIAL_PRODUCTOS));
    localStorage.setItem('costenita_inventario', JSON.stringify(INITIAL_INVENTARIO));
    localStorage.setItem('costenita_proveedores', JSON.stringify(INITIAL_PROVEEDORES));
    localStorage.setItem('costenita_compras', JSON.stringify(INITIAL_COMPRAS));
    localStorage.setItem('costenita_movimientos', JSON.stringify(INITIAL_MOVIMIENTOS));
    localStorage.setItem('costenita_ventas', JSON.stringify(INITIAL_VENTAS));
    localStorage.setItem('costenita_db_version', CURRENT_VERSION);
    console.info('[Costeñita DB] Almacenamiento local migrado a HU01 (con precios de venta y descripción).');
  }
}

