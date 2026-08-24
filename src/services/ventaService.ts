import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Venta } from '../types/models';
import { INITIAL_VENTAS } from './mockData';
import { productoService } from './productoService';
import { inventarioService } from './inventarioService';

const VENTAS_KEY = 'costenita_ventas';

function getLocalVentas(): Venta[] {
  const data = localStorage.getItem(VENTAS_KEY);
  if (!data) {
    localStorage.setItem(VENTAS_KEY, JSON.stringify(INITIAL_VENTAS));
    return INITIAL_VENTAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_VENTAS;
  }
}

function saveLocalVentas(ventas: Venta[]) {
  localStorage.setItem(VENTAS_KEY, JSON.stringify(ventas));
}

export const ventaService = {
  /**
   * Obtiene el listado de ventas realizadas
   */
  async obtenerVentas(): Promise<Venta[]> {
    const productos = await productoService.obtenerProductos();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('venta')
        .select('*')
        .order('id_venta', { ascending: false });

      if (!error && data) {
        return (data as Venta[]).map(v => ({
          ...v,
          producto: productos.find(p => p.id_producto === v.id_producto)
        }));
      }
    }

    const localVentas = getLocalVentas();
    return localVentas.map(v => ({
      ...v,
      producto: productos.find(p => p.id_producto === v.id_producto)
    }));
  },

  /**
   * HU09: Registra una venta, descuenta el stock de inventario (HU07) y guarda el registro
   */
  async registrarVenta(venta: Omit<Venta, 'id_venta'>): Promise<Venta> {
    if (venta.cantidad <= 0) {
      throw new Error('La cantidad vendida debe ser estrictamente mayor a 0');
    }

    // Validar y descontar stock primero
    await inventarioService.registrarSalida(
      venta.id_producto,
      venta.cantidad,
      venta.fecha,
      `Venta comercial a ${venta.cliente || 'Cliente'}`
    );

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('venta') as any)
        .insert([{
          fecha: venta.fecha,
          cliente: venta.cliente.trim(),
          id_producto: venta.id_producto,
          cantidad: venta.cantidad,
          precio_unitario: venta.precio_unitario,
          total: venta.total || venta.cantidad * venta.precio_unitario,
          estado: venta.estado || 'COMPLETADA'
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Venta;
    }

    const ventas = getLocalVentas();
    const nextId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id_venta)) + 1 : 1;
    const nuevaVenta: Venta = {
      ...venta,
      id_venta: nextId,
      created_at: new Date().toISOString()
    };
    ventas.unshift(nuevaVenta);
    saveLocalVentas(ventas);

    return nuevaVenta;
  }
};
