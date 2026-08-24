// ==============================================================================
// SISTEMA COSTEÑITA — Modelos y Tipos de Dominio (3FN & Reglas de Negocio)
// ==============================================================================

export type EstadoProducto = 'ACTIVO' | 'INACTIVO';
export type EstadoCompra = 'REGISTRADA' | 'ANULADA';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
/**
 * Unidades de medida permitidas para la gestión por peso de miel y derivados
 */
export type UnidadMedida = 'GRAMOS' | 'KG' | 'UNIDAD';
export type EstadoVenta = 'COMPLETADA' | 'ANULADA';

/**
 * Entidad PRODUCTO (3FN)
 * - id_producto (PK)
 * - nombre
 * - presentacion (en gramos o kilos: ej. 250 g, 500 g, 1 kg, Balde 25 kg)
 * - estado
 * Restricción: (nombre, presentacion) es UNIQUE
 */
export interface Producto {
  id_producto: number;
  nombre: string;
  presentacion: string;
  precio_venta?: number;
  descripcion?: string;
  estado: EstadoProducto;
  created_at?: string;
}

/**
 * Entidad PROVEEDOR (Apicultor) (3FN)
 * - id_proveedor (PK)
 * - nombre
 * - telefono (UNIQUE)
 * - localidad
 */
export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string;
  localidad: string;
  created_at?: string;
}

/**
 * Entidad INVENTARIO (3FN - Relación 1:1 con Producto)
 * - id_inventario (PK)
 * - stock_actual (>= 0)
 * - unidad_medida ('GRAMOS' | 'KG' | 'UNIDAD')
 * - id_producto (FK UNIQUE)
 */
export interface Inventario {
  id_inventario: number;
  id_producto: number;
  stock_actual: number;
  unidad_medida: UnidadMedida;
  updated_at?: string;
  // Campos embebidos para vistas (Join con Producto)
  producto?: Producto;
}

/**
 * Entidad COMPRA (3FN - Acopio por Peso)
 * - id_compra (PK)
 * - fecha
 * - cantidad (> 0)
 * - unidad_medida ('GRAMOS' | 'KG' | 'UNIDAD')
 * - estado (REGISTRADA | ANULADA)
 * - id_proveedor (FK)
 * - id_producto (FK)
 */
export interface Compra {
  id_compra: number;
  fecha: string;
  cantidad: number;
  unidad_medida: UnidadMedida;
  estado: EstadoCompra;
  id_proveedor: number;
  id_producto: number;
  precio_unitario?: number;
  total?: number;
  observaciones?: string;
  created_at?: string;
  // Relaciones cargadas
  proveedor?: Proveedor;
  producto?: Producto;
}

/**
 * Entidad MOVIMIENTO_INVENTARIO (3FN - Kardex por Peso)
 * - id_movimiento (PK)
 * - tipo (ENTRADA | SALIDA | AJUSTE)
 * - cantidad (> 0)
 * - unidad_medida ('GRAMOS' | 'KG' | 'UNIDAD')
 * - fecha
 * - id_producto (FK)
 */
export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  tipo: TipoMovimiento;
  cantidad: number;
  unidad_medida?: UnidadMedida;
  fecha: string;
  motivo?: string;
  id_referencia?: number;
  created_at?: string;
  producto?: Producto;
}

/**
 * Entidad VENTA (Comercialización)
 */
export interface Venta {
  id_venta: number;
  fecha: string;
  cliente: string;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  estado: EstadoVenta;
  created_at?: string;
  producto?: Producto;
}

/**
 * Resultado estándar de operaciones de Controlador
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * KPIs para el Dashboard
 */
export interface DashboardMetrics {
  totalProductosActivos: number;
  totalProveedores: number;
  stockTotalUnidades: number;
  comprasMesTotal: number;
  ventasMesTotal: number;
  alertasStockBajo: number;
}
