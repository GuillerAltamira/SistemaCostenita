import { ventaService, extraerPesoNominalKg } from '../services/ventaService';
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
   * HU09: Registra la venta, valida stock de producto envasado Y valida stock de materia prima en bruto
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

    // 3. Verificar stock de producto envasado antes de vender
    const stockDisponible = await inventarioService.consultarStock(idProducto);
    if (stockDisponible < cantidad) {
      return {
        success: false,
        message: 'Stock de producto envasado insuficiente.',
        error: `Solo hay ${stockDisponible} unidades de ${prod.nombre} (${prod.presentacion}) disponibles. Cantidad solicitada: ${cantidad}.`
      };
    }

    // 4. Verificar stock de Materia Prima Bruta (en KG)
    const prodMateriaPrima = productos.find(p => {
      const nom = p.nombre.toLowerCase();
      const pres = p.presentacion.toLowerCase();
      return nom.includes('granel') || nom.includes('materia prima') || pres.includes('balde') || pres.includes('25 kg') || pres.includes('granel');
    }) || productos.find(p => p.id_producto === 5);

    const esMateriaPrimaDirecta = prodMateriaPrima && prod.id_producto === prodMateriaPrima.id_producto;
    if (!esMateriaPrimaDirecta && prodMateriaPrima) {
      const pesoNominalUnitarioKg = extraerPesoNominalKg(prod.presentacion);
      const pesoTotalKg = pesoNominalUnitarioKg * cantidad;
      const stockMateriaPrimaKg = await inventarioService.consultarStock(prodMateriaPrima.id_producto);

      if (stockMateriaPrimaKg < pesoTotalKg) {
        return {
          success: false,
          message: 'Stock de Materia Prima en Bruto insuficiente.',
          error: `Se requieren ${pesoTotalKg.toFixed(2)} KG de Miel en Bruto para envasar/cubrir ${cantidad} unid. de ${prod.nombre} (${prod.presentacion}), pero solo hay ${stockMateriaPrimaKg.toFixed(2)} KG disponibles en almacén.`
        };
      }
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
