import { ventaService } from '../services/ventaService';
import { productoService } from '../services/productoService';
import { inventarioService } from '../services/inventarioService';
import { Venta, OperationResult } from '../types/models';

export class VentaController {
  /**
   * Valida los datos requeridos para registrar una venta
   */
  static validarDatosVenta(
    idProducto: number,
    cantidad: number,
    precioUnitario: number,
    fecha: string
  ): { valid: boolean; error?: string } {
    if (!idProducto || idProducto <= 0) {
      return { valid: false, error: 'Debe seleccionar un producto a vender.' };
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      return { valid: false, error: 'La cantidad a vender debe ser mayor que cero.' };
    }
    if (isNaN(precioUnitario) || precioUnitario <= 0) {
      return { valid: false, error: 'El precio unitario de venta debe ser mayor a 0 Bs.' };
    }
    if (!fecha) {
      return { valid: false, error: 'La fecha de la venta es obligatoria.' };
    }
    return { valid: true };
  }

  /**
   * HU09: Registra la venta y realiza el descargo del inventario con validación de stock
   */
  static async registrarVenta(
    cliente: string,
    idProducto: number,
    cantidad: number,
    precioUnitario: number,
    fecha: string = new Date().toISOString().split('T')[0]
  ): Promise<OperationResult<Venta>> {
    // 1. Validar datos
    const validacion = this.validarDatosVenta(idProducto, cantidad, precioUnitario, fecha);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'Verifique los datos de la venta.',
        error: validacion.error
      };
    }

    // 2. Verificar existencia de producto
    const productos = await productoService.obtenerProductos();
    const prod = productos.find(p => p.id_producto === idProducto);
    if (!prod) {
      return {
        success: false,
        message: 'Producto no encontrado.',
        error: `No existe ningún producto con ID ${idProducto}.`
      };
    }

    // 3. Verificar stock antes de vender
    const stockDisponible = await inventarioService.consultarStock(idProducto);
    if (stockDisponible < cantidad) {
      return {
        success: false,
        message: 'Stock insuficiente para concretar la venta.',
        error: `Stock actual: ${stockDisponible} unidades. Cantidad solicitada: ${cantidad}.`
      };
    }

    // 4. Guardar venta
    try {
      const nuevaVenta = await ventaService.registrarVenta({
        cliente: cliente || 'Cliente Mostrador',
        id_producto: idProducto,
        cantidad,
        precio_unitario: precioUnitario,
        total: cantidad * precioUnitario,
        fecha,
        estado: 'COMPLETADA'
      });

      return {
        success: true,
        message: 'Venta registrada exitosamente y stock descontado.',
        data: nuevaVenta
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la venta.';
      return {
        success: false,
        message: 'Error al procesar la venta.',
        error: errorMsg
      };
    }
  }

  /**
   * Obtiene la lista de ventas registradas
   */
  static async obtenerVentas(): Promise<Venta[]> {
    return await ventaService.obtenerVentas();
  }
}
