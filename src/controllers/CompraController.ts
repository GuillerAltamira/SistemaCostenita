import { compraService } from '../services/compraService';
import { proveedorService } from '../services/proveedorService';
import { productoService } from '../services/productoService';
import { Compra, OperationResult, UnidadMedida } from '../types/models';

export class CompraController {
  /**
   * Valida los datos requeridos para registrar una compra (Gestión por Peso)
   */
  static validarDatosCompra(
    idProveedor: number,
    idProducto: number,
    cantidad: number,
    fecha: string,
    unidadMedida: string
  ): { valid: boolean; error?: string } {
    if (!idProveedor || idProveedor <= 0) {
      return { valid: false, error: 'Debe seleccionar un proveedor / apicultor válido.' };
    }
    if (!idProducto || idProducto <= 0) {
      return { valid: false, error: 'Debe seleccionar un producto o tipo de miel válido.' };
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      return { valid: false, error: 'La cantidad debe ser mayor que cero.' };
    }
    if (!fecha) {
      return { valid: false, error: 'La fecha de compra es obligatoria.' };
    }
    const unidadesValidas: UnidadMedida[] = ['KG', 'GRAMOS', 'UNIDAD'];
    if (!unidadMedida || !unidadesValidas.includes(unidadMedida as UnidadMedida)) {
      return {
        valid: false,
        error: 'Unidad de medida no permitida. El acopio de materia prima a granel debe realizarse en KG (Kilogramos).'
      };
    }
    return { valid: true };
  }

  /**
   * Verifica la existencia del proveedor en la base de datos
   */
  static async verificarProveedor(idProveedor: number): Promise<boolean> {
    const proveedores = await proveedorService.obtenerProveedores();
    return proveedores.some(p => p.id_proveedor === idProveedor);
  }

  /**
   * Verifica la existencia del producto en el catálogo
   */
  static async verificarProducto(idProducto: number): Promise<boolean> {
    const productos = await productoService.obtenerProductos();
    return productos.some(p => p.id_producto === idProducto);
  }

  /**
   * HU04: Flujo de registro de compra de miel con afectación automática a inventario
   */
  static async registrarCompra(
    idProveedor: number,
    idProducto: number,
    cantidad: number,
    unidadMedida: UnidadMedida = 'KG',
    fecha: string = new Date().toISOString().split('T')[0],
    precioUnitario: number = 0,
    observaciones: string = ''
  ): Promise<OperationResult<Compra>> {
    // 1. Validar datos de la compra
    const validacion = this.validarDatosCompra(idProveedor, idProducto, cantidad, fecha, unidadMedida);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'Verifique los datos de la compra.',
        error: validacion.error
      };
    }

    // 2. Verificar existencia del proveedor
    const proveedorExiste = await this.verificarProveedor(idProveedor);
    if (!proveedorExiste) {
      return {
        success: false,
        message: 'Proveedor no encontrado.',
        error: `No existe ningún proveedor registrado con ID ${idProveedor}.`
      };
    }

    // 3. Verificar existencia del producto
    const productoExiste = await this.verificarProducto(idProducto);
    if (!productoExiste) {
      return {
        success: false,
        message: 'Producto no encontrado.',
        error: `No existe ningún producto registrado con ID ${idProducto}.`
      };
    }

    // 4. Guardar compra y actualizar automáticamente el stock en inventario
    try {
      const nuevaCompra = await compraService.guardarCompra({
        id_proveedor: idProveedor,
        id_producto: idProducto,
        cantidad,
        unidad_medida: unidadMedida,
        fecha,
        estado: 'REGISTRADA',
        precio_unitario: precioUnitario,
        total: precioUnitario * cantidad,
        observaciones
      });

      return {
        success: true,
        message: 'Compra registrada exitosamente e inventario actualizado.',
        data: nuevaCompra
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la compra.';
      return {
        success: false,
        message: 'Error al procesar la compra.',
        error: errorMsg
      };
    }
  }

  /**
   * Obtiene la lista de compras registradas
   */
  static async obtenerCompras(): Promise<Compra[]> {
    return await compraService.obtenerCompras();
  }
}
