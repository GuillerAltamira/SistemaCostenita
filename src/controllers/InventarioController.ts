import { inventarioService } from '../services/inventarioService';
import { productoService } from '../services/productoService';
import { Inventario, MovimientoInventario, OperationResult } from '../types/models';

export class InventarioController {
  /**
   * Valida que la cantidad sea un número positivo mayor que cero
   */
  static validarCantidad(cantidad: number): { valid: boolean; error?: string } {
    if (isNaN(cantidad) || cantidad <= 0) {
      return { valid: false, error: 'La cantidad debe ser mayor que cero.' };
    }
    return { valid: true };
  }

  /**
   * Verifica la existencia del producto en el catálogo
   */
  static async verificarProducto(idProducto: number): Promise<boolean> {
    const productos = await productoService.obtenerProductos();
    return productos.some(p => p.id_producto === idProducto);
  }

  /**
   * HU08: Consultar todo el inventario de Costeñita
   */
  static async consultarInventario(): Promise<Inventario[]> {
    return await inventarioService.consultarInventario();
  }

  /**
   * HU08: Consultar stock disponible de un producto
   */
  static async consultarStock(idProducto: number): Promise<number> {
    return await inventarioService.consultarStock(idProducto);
  }

  /**
   * HU06: Registrar Entrada de Producto al Inventario
   */
  static async registrarEntrada(
    idProducto: number,
    cantidad: number,
    fecha: string = new Date().toISOString().split('T')[0],
    motivo: string = 'Entrada manual de inventario'
  ): Promise<OperationResult<{ stockNuevo: number; movimiento: MovimientoInventario }>> {
    // 1. Validar cantidad
    const validacion = this.validarCantidad(cantidad);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'La cantidad debe ser mayor que cero.',
        error: validacion.error
      };
    }

    // 2. Verificar existencia del producto
    const existe = await this.verificarProducto(idProducto);
    if (!existe) {
      return {
        success: false,
        message: 'Producto no encontrado.',
        error: `No existe ningún producto registrado con ID ${idProducto}.`
      };
    }

    // 3. Registrar entrada y actualizar stock
    try {
      const resultado = await inventarioService.registrarEntrada(idProducto, cantidad, fecha, motivo);
      return {
        success: true,
        message: 'Entrada registrada correctamente.',
        data: resultado
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar entrada en inventario.';
      return {
        success: false,
        message: 'Error al registrar entrada.',
        error: errorMsg
      };
    }
  }

  /**
   * HU07: Registrar Salida de Producto con validación estricta de Stock
   */
  static async registrarSalida(
    idProducto: number,
    cantidad: number,
    fecha: string = new Date().toISOString().split('T')[0],
    motivo: string = 'Salida manual de inventario'
  ): Promise<OperationResult<{ stockNuevo: number; movimiento: MovimientoInventario }>> {
    // 1. Validar cantidad
    const validacion = this.validarCantidad(cantidad);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'La cantidad debe ser mayor que cero.',
        error: validacion.error
      };
    }

    // 2. Verificar existencia del producto
    const existe = await this.verificarProducto(idProducto);
    if (!existe) {
      return {
        success: false,
        message: 'Producto no encontrado.',
        error: `No existe ningún producto con ID ${idProducto}.`
      };
    }

    // 3. Verificar stock disponible (HU07 secuencia)
    const stockDisponible = await this.consultarStock(idProducto);
    if (stockDisponible < cantidad) {
      return {
        success: false,
        message: 'Stock insuficiente.',
        error: `Stock actual: ${stockDisponible}. Se intentó retirar ${cantidad} unidades.`
      };
    }

    // 4. Actualizar inventario
    try {
      const resultado = await inventarioService.registrarSalida(idProducto, cantidad, fecha, motivo);
      return {
        success: true,
        message: 'Salida registrada correctamente.',
        data: resultado
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar salida en inventario.';
      return {
        success: false,
        message: 'Error al procesar salida.',
        error: errorMsg
      };
    }
  }

  /**
   * Obtener movimientos históricos (Kardex)
   */
  static async obtenerMovimientos(): Promise<MovimientoInventario[]> {
    return await inventarioService.obtenerMovimientos();
  }
}
