import {
  ventaService,
  calcularPesoEquivalenteKg,
  esProductoComercial,
  encontrarMateriaPrimaBruta
} from '../services/ventaService';
import { productoService } from '../services/productoService';
import { inventarioService } from '../services/inventarioService';
import { Venta, OperationResult, CanalVenta } from '../types/models';

export class VentaController {
  /**
   * Valida los datos requeridos para registrar una venta (HU09, HU10, HU11)
   */
  static validarDatosVenta(
    idProducto: number,
    cantidad: number,
    precioUnitario: number,
    fecha: string,
    canal?: CanalVenta
  ): { valid: boolean; error?: string } {
    if (!idProducto || idProducto <= 0) {
      return { valid: false, error: 'Debe seleccionar un producto comercial envasado.' };
    }
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      return { valid: false, error: 'La cantidad a vender debe ser un número entero mayor que cero.' };
    }
    if (isNaN(precioUnitario) || precioUnitario <= 0) {
      return { valid: false, error: 'El precio unitario de venta debe ser mayor a 0 Bs.' };
    }
    if (!fecha) {
      return { valid: false, error: 'La fecha de la venta es obligatoria.' };
    }
    if (
      canal &&
      ![
        'Venta Mostrador',
        'WhatsApp / Pedido Local',
        'Feria Local / Mercado',
        'Distribuidor / Tienda'
      ].includes(canal)
    ) {
      return { valid: false, error: 'El canal de venta seleccionado no es válido.' };
    }
    return { valid: true };
  }

  /**
   * HU09, HU10, HU11: Registra la venta comercial con validación cruzada y canal
   */
  static async registrarVenta(
    cliente: string,
    canal: CanalVenta,
    idProducto: number,
    cantidad: number,
    precioUnitario: number,
    fecha: string = new Date().toISOString().split('T')[0]
  ): Promise<OperationResult<Venta>> {
    // 1. Validar datos
    const validacion = this.validarDatosVenta(idProducto, cantidad, precioUnitario, fecha, canal);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'Verifique los datos de la venta.',
        error: validacion.error
      };
    }

    // 2. Verificar existencia de producto y que sea envasado (HU09)
    const productos = await productoService.obtenerProductos();
    const prod = productos.find(p => p.id_producto === idProducto);
    if (!prod) {
      return {
        success: false,
        message: 'Producto no encontrado.',
        error: `No existe ningún producto con ID ${idProducto}.`
      };
    }

    if (!esProductoComercial(prod)) {
      return {
        success: false,
        message: 'Producto no apto para venta comercial.',
        error: 'No se permite vender directamente materia prima a granel en baldes (HU09).'
      };
    }

    // 3. Paso A: Verificar stock de producto envasado antes de vender
    const stockDisponible = await inventarioService.consultarStock(idProducto);
    if (stockDisponible < cantidad) {
      return {
        success: false,
        message: 'Stock de producto envasado insuficiente.',
        error: `Solo hay ${stockDisponible} unidades de ${prod.nombre} (${prod.presentacion}) disponibles. Cantidad solicitada: ${cantidad}.`
      };
    }

    // 4. Pasos B y C: Verificar stock de Materia Prima Bruta (en KG)
    const pesoTotalKg = calcularPesoEquivalenteKg(prod.presentacion, cantidad);
    const prodMateriaPrima = encontrarMateriaPrimaBruta(productos);

    if (prodMateriaPrima) {
      const stockMateriaPrimaKg = await inventarioService.consultarStock(prodMateriaPrima.id_producto);
      if (stockMateriaPrimaKg < pesoTotalKg) {
        return {
          success: false,
          message: 'Stock insuficiente de miel bruta acopiada para cubrir el lote vendido',
          error: `Stock insuficiente de miel bruta acopiada para cubrir el lote vendido. Se requieren ${pesoTotalKg.toFixed(2)} KG y solo hay ${stockMateriaPrimaKg.toFixed(2)} KG disponibles en almacén.`
        };
      }
    }

    // 5. Paso D: Guardar venta a través de ventaService
    try {
      const nuevaVenta = await ventaService.registrarVenta({
        cliente: cliente?.trim() || 'Cliente Mostrador',
        canal: canal || 'Venta Mostrador',
        id_producto: idProducto,
        cantidad,
        precio_unitario: precioUnitario,
        total: cantidad * precioUnitario,
        fecha,
        estado: 'COMPLETADA'
      });

      return {
        success: true,
        message: `Venta registrada exitosamente. Se descontaron ${cantidad} unidades y ${pesoTotalKg.toFixed(2)} KG de miel bruta.`,
        data: nuevaVenta
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la venta.';
      return {
        success: false,
        message: errorMsg,
        error: errorMsg
      };
    }
  }

  /**
   * HU12: Obtiene la lista de ventas registradas
   */
  static async obtenerVentas(): Promise<Venta[]> {
    return await ventaService.obtenerVentas();
  }
}
