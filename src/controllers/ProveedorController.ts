import { proveedorService } from '../services/proveedorService';
import { Proveedor, OperationResult } from '../types/models';

export class ProveedorController {
  /**
   * Valida los campos obligatorios del proveedor
   */
  static validarDatosProveedor(nombre: string, telefono: string, localidad: string): { valid: boolean; error?: string } {
    if (!nombre || nombre.trim().length === 0) {
      return { valid: false, error: 'El nombre del apicultor / proveedor es obligatorio.' };
    }
    if (!telefono || telefono.trim().length === 0) {
      return { valid: false, error: 'El teléfono de contacto es obligatorio.' };
    }
    if (!localidad || localidad.trim().length === 0) {
      return { valid: false, error: 'La localidad o comunidad es obligatoria (ej. El Palmar, Villa Montes).' };
    }
    return { valid: true };
  }

  /**
   * Verifica si el teléfono ya está registrado para otro proveedor
   */
  static async verificarProveedorDuplicado(telefono: string, excludeId?: number): Promise<boolean> {
    return await proveedorService.verificarProveedorDuplicado(telefono, excludeId);
  }

  /**
   * HU03: Flujo de registro de proveedor/apicultor según diagrama PlantUML
   */
  static async registrarProveedor(
    nombre: string,
    telefono: string,
    localidad: string
  ): Promise<OperationResult<Proveedor>> {
    // 1. Validar datos
    const validacion = this.validarDatosProveedor(nombre, telefono, localidad);
    if (!validacion.valid) {
      return {
        success: false,
        message: 'Complete los datos obligatorios.',
        error: validacion.error
      };
    }

    // 2. Verificar duplicado por teléfono
    const yaExiste = await this.verificarProveedorDuplicado(telefono);
    if (yaExiste) {
      return {
        success: false,
        message: 'El proveedor ya existe.',
        error: `Ya existe un proveedor registrado con el teléfono "${telefono}".`
      };
    }

    // 3. Guardar en Base de Datos
    try {
      const nuevoProveedor = await proveedorService.guardarProveedor({
        nombre,
        telefono,
        localidad
      });

      return {
        success: true,
        message: 'Proveedor registrado exitosamente.',
        data: nuevoProveedor
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el proveedor.';
      return {
        success: false,
        message: 'Error al registrar el proveedor.',
        error: errorMsg
      };
    }
  }

  /**
   * Obtiene la lista de todos los proveedores
   */
  static async obtenerProveedores(): Promise<Proveedor[]> {
    return await proveedorService.obtenerProveedores();
  }
}
