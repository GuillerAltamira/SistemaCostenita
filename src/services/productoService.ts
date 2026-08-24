import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Producto } from '../types/models';
import { INITIAL_PRODUCTOS } from './mockData';

const LOCAL_STORAGE_KEY = 'costenita_productos';

function getLocalProductos(): Producto[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTOS));
    return INITIAL_PRODUCTOS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTOS;
  }
}

function saveLocalProductos(productos: Producto[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(productos));
}

export const productoService = {
  /**
   * Obtiene todos los productos registrados
   */
  async obtenerProductos(): Promise<Producto[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('id_producto', { ascending: true });

      if (error) {
        console.error('Error al obtener productos de Supabase:', error);
        return getLocalProductos();
      }
      return (data as Producto[]) || [];
    }

    return getLocalProductos();
  },

  /**
   * Verifica si ya existe un producto con el mismo binomio (nombre, presentación)
   */
  async verificarProductoDuplicado(nombre: string, presentacion: string, excludeId?: number): Promise<boolean> {
    const cleanNombre = nombre.trim().toLowerCase();
    const cleanPresentacion = presentacion.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('producto')
        .select('id_producto')
        .ilike('nombre', cleanNombre)
        .ilike('presentacion', cleanPresentacion);

      if (excludeId) {
        query = query.neq('id_producto', excludeId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error verificando duplicado en Supabase:', error);
      } else {
        return (data && data.length > 0) || false;
      }
    }

    const productos = getLocalProductos();
    return productos.some(
      (p) =>
        p.nombre.trim().toLowerCase() === cleanNombre &&
        p.presentacion.trim().toLowerCase() === cleanPresentacion &&
        p.id_producto !== excludeId
    );
  },

  /**
   * Guarda un nuevo producto en la base de datos
   */
  async guardarProducto(producto: Omit<Producto, 'id_producto'>): Promise<Producto> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('producto') as any)
        .insert([{
          nombre: producto.nombre.trim(),
          presentacion: producto.presentacion.trim(),
          precio_venta: Number(producto.precio_venta || 0),
          descripcion: producto.descripcion ? producto.descripcion.trim() : null,
          estado: producto.estado || 'ACTIVO'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Producto;
    }

    const productos = getLocalProductos();
    const nextId = productos.length > 0 ? Math.max(...productos.map(p => p.id_producto)) + 1 : 1;
    const nuevoProducto: Producto = {
      id_producto: nextId,
      nombre: producto.nombre.trim(),
      presentacion: producto.presentacion.trim(),
      precio_venta: Number(producto.precio_venta || 0),
      descripcion: producto.descripcion ? producto.descripcion.trim() : undefined,
      estado: producto.estado || 'ACTIVO',
      created_at: new Date().toISOString()
    };

    productos.push(nuevoProducto);
    saveLocalProductos(productos);
    return nuevoProducto;
  }
};
