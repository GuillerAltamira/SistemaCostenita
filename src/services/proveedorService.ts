import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Proveedor } from '../types/models';
import { INITIAL_PROVEEDORES } from './mockData';

const LOCAL_STORAGE_KEY = 'costenita_proveedores';

function getLocalProveedores(): Proveedor[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PROVEEDORES));
    return INITIAL_PROVEEDORES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PROVEEDORES;
  }
}

function saveLocalProveedores(proveedores: Proveedor[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(proveedores));
}

export const proveedorService = {
  /**
   * Obtiene la lista de proveedores / apicultores
   */
  async obtenerProveedores(): Promise<Proveedor[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('proveedor')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener proveedores de Supabase:', error);
        return getLocalProveedores();
      }
      return (data as Proveedor[]) || [];
    }

    return getLocalProveedores();
  },

  /**
   * Verifica si ya existe un proveedor registrado con el mismo número telefónico
   */
  async verificarProveedorDuplicado(telefono: string, excludeId?: number): Promise<boolean> {
    const cleanTel = telefono.trim();

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('proveedor')
        .select('id_proveedor')
        .eq('telefono', cleanTel);

      if (excludeId) {
        query = query.neq('id_proveedor', excludeId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error verificando proveedor en Supabase:', error);
      } else {
        return (data && data.length > 0) || false;
      }
    }

    const proveedores = getLocalProveedores();
    return proveedores.some(p => p.telefono.trim() === cleanTel && p.id_proveedor !== excludeId);
  },

  /**
   * Guarda un nuevo proveedor en la base de datos
   */
  async guardarProveedor(proveedor: Omit<Proveedor, 'id_proveedor'>): Promise<Proveedor> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('proveedor') as any)
        .insert([{
          nombre: proveedor.nombre.trim(),
          telefono: proveedor.telefono.trim(),
          localidad: proveedor.localidad.trim()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Proveedor;
    }

    const proveedores = getLocalProveedores();
    const nextId = proveedores.length > 0 ? Math.max(...proveedores.map(p => p.id_proveedor)) + 1 : 1;
    const nuevoProveedor: Proveedor = {
      id_proveedor: nextId,
      nombre: proveedor.nombre.trim(),
      telefono: proveedor.telefono.trim(),
      localidad: proveedor.localidad.trim(),
      created_at: new Date().toISOString()
    };

    proveedores.push(nuevoProveedor);
    saveLocalProveedores(proveedores);
    return nuevoProveedor;
  }
};
