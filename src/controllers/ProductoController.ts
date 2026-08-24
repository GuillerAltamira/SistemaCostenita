import { productoService } from '../services/productoService';
import { Producto, OperationResult, EstadoProducto } from '../types/models';

export class ProductoController {
  /**
   * Valida que los campos obligatorios no estén vacíos
   */
  /**
   * Valida los campos obligatorios del producto (HU01)
   */
  static validarDatosProducto(
    nombre: string,
    presentacion: string,
    precioVenta?: number
  ): { valid: boolean; error?: string } {
    if (!nombre || nombre.trim().length === 0) {
      return { valid: false, error: 'El nombre del producto es obligatorio.' };
    }
    if (!presentacion || presentacion.trim().length === 0) {
      return { valid: false, error: 'La presentación del producto es obligatoria (ej. 250 g, 500 g, 1 kg, 5 kg).' };
    }
    if (precioVenta !== undefined && (isNaN(precioVenta) || precioVenta < 0)) {
      return { valid: false, error: 'El precio de venta debe ser un número mayor o igual a 0 Bs.' };
    }
    const cleanPres = presentacion.toLowerCase();
    const contieneUnidadPeso = /(g|gr|gramos|kg|kilo|kilos|balde|frasco|gotero|envase|botella)/i.test(cleanPres);
    if (!contieneUnidadPeso) {
      return {
        valid: false,
        error: 'La presentación debe expresarse en unidades de peso (ej. 250 g, 500 g, 1 kg, 5 kg, Balde 25 kg).'
      };
    }
    return { valid: true };
  }

  /**
   * Verifica si ya existe un producto con el mismo nombre y presentación
   */
  static async verificarProductoDuplicado(nombre: string, presentacion: string, excludeId?: number): Promise<boolean> {
    return await productoService.verificarProductoDuplicado(nombre, presentacion, excludeId);
  }

  /**
   * HU01: Flujo completo de registro de producto según diagrama de secuencia PlantUML
   */
  static async registrarProducto(
    nombre: string,
    presentacion: string,
    precioVenta: number = 0,
    descripcion: string = '',
    estado: EstadoProducto = 'ACTIVO'
  ): Promise<OperationResult<Producto>> {
    // 1. Validar datos
    const validacion = this.validarDatosProducto(nombre, presentacion, precioVenta);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'Complete los campos obligatorios.',
        error: validacion.error
      };
    }

    // 2. Flujo de Extensión: Verificar duplicado (PlantUML HU01)
    const yaExiste = await this.verificarProductoDuplicado(nombre, presentacion);
    if (yaExiste) {
      return {
        success: false,
        message: 'El producto ya existe.',
        error: `Ya existe un producto registrado como "${nombre}" en presentación "${presentacion}". Verifique el catálogo para evitar duplicados.`
      };
    }

    // 3. Guardar en Base de Datos / Supabase
    try {
      const nuevoProducto = await productoService.guardarProducto({
        nombre,
        presentacion,
        precio_venta: precioVenta,
        descripcion,
        estado
      });

      return {
        success: true,
        message: 'Producto registrado exitosamente.',
        data: nuevoProducto
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al guardar el producto.';
      return {
        success: false,
        message: 'Error al registrar el producto.',
        error: errorMsg
      };
    }
  }

  /**
   * Obtiene la lista completa de productos
   */
  static async obtenerProductos(): Promise<Producto[]> {
    return await productoService.obtenerProductos();
  }
}
