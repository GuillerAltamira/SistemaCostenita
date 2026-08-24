import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Compra } from '../types/models';
import { INITIAL_COMPRAS } from './mockData';
import { productoService } from './productoService';
import { proveedorService } from './proveedorService';
import { inventarioService } from './inventarioService';

const COMPRAS_KEY = 'costenita_compras';

function getLocalCompras(): Compra[] {
  const data = localStorage.getItem(COMPRAS_KEY);
  if (!data) {
    localStorage.setItem(COMPRAS_KEY, JSON.stringify(INITIAL_COMPRAS));
    return INITIAL_COMPRAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_COMPRAS;
  }
}

function saveLocalCompras(compras: Compra[]) {
  localStorage.setItem(COMPRAS_KEY, JSON.stringify(compras));
}

export const compraService = {
  /**
   * Obtiene la lista de compras registradas junto a los datos del proveedor y producto
   */
  async obtenerCompras(): Promise<Compra[]> {
    const [productos, proveedores] = await Promise.all([
      productoService.obtenerProductos(),
      proveedorService.obtenerProveedores()
    ]);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('compra')
        .select('*')
        .order('id_compra', { ascending: false });

      if (!error && data) {
        return (data as Compra[]).map(c => ({
          ...c,
          producto: productos.find(p => p.id_producto === c.id_producto),
          proveedor: proveedores.find(pr => pr.id_proveedor === c.id_proveedor)
        }));
      }
    }

    const localCompras = getLocalCompras();
    return localCompras.map(c => ({
      ...c,
      producto: productos.find(p => p.id_producto === c.id_producto),
      proveedor: proveedores.find(pr => pr.id_proveedor === c.id_proveedor)
    }));
  },

  /**
   * HU04: Guarda la compra y actualiza automáticamente el inventario (Entrada)
   */
  async guardarCompra(compra: Omit<Compra, 'id_compra'>): Promise<Compra> {
    if (compra.cantidad <= 0) {
      throw new Error('La cantidad comprada debe ser estrictamente mayor a 0');
    }

    let compraCreada: Compra;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('compra') as any)
        .insert([{
          fecha: compra.fecha,
          cantidad: compra.cantidad,
          unidad_medida: compra.unidad_medida,
          estado: compra.estado || 'REGISTRADA',
          id_proveedor: compra.id_proveedor,
          id_producto: compra.id_producto,
          precio_unitario: compra.precio_unitario || 0,
          total: (compra.precio_unitario || 0) * compra.cantidad,
          observaciones: compra.observaciones || null
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      compraCreada = data as Compra;
    } else {
      const compras = getLocalCompras();
      const nextId = compras.length > 0 ? Math.max(...compras.map(c => c.id_compra)) + 1 : 1;
      compraCreada = {
        ...compra,
        id_compra: nextId,
        total: (compra.precio_unitario || 0) * compra.cantidad,
        created_at: new Date().toISOString()
      };
      compras.unshift(compraCreada);
      saveLocalCompras(compras);
    }

    // Afectar automáticamente el stock de inventario (HU04 secuencia -> InventarioController.registrarEntrada)
    await inventarioService.registrarEntrada(
      compra.id_producto,
      compra.cantidad,
      compra.fecha,
      `Acopio / Compra ID #${compraCreada.id_compra}`,
      compra.unidad_medida
    );

    return compraCreada;
  }
};
