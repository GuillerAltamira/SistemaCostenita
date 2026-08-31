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

/**
 * Extrae el peso nominal en Kilogramos (KG) a partir de la descripción de presentación.
 * Ejemplos: 'Frasco 250 g' -> 0.25 KG, 'Frasco 500 g' -> 0.50 KG, 'Frasco 1 kg' -> 1.00 KG.
 */
export function extraerPesoNominalKg(presentacion: string): number {
  if (!presentacion) return 1.0;
  const str = presentacion.toLowerCase().trim();

  // Buscar patrones en gramos (ej. 250 g, 500 g, 30 g, 200 g)
  const matchGramos = str.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (matchGramos) {
    const g = parseFloat(matchGramos[1]);
    if (!isNaN(g) && g > 0) return g / 1000;
  }

  // Buscar patrones en kilogramos (ej. 1 kg, 25 kg, 0.5 kg)
  const matchKg = str.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (matchKg) {
    const kg = parseFloat(matchKg[1]);
    if (!isNaN(kg) && kg > 0) return kg;
  }

  return 1.0; // Valor nominal por defecto
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
   * HU09: Registra una venta, descuenta el stock del producto envasado Y realiza el
   * descuento cruzado automático del peso en KG de Miel en Bruto (Materia Prima).
   */
  async registrarVenta(venta: Omit<Venta, 'id_venta'>): Promise<Venta> {
    if (venta.cantidad <= 0) {
      throw new Error('La cantidad vendida debe ser strictly mayor a 0');
    }

    // 1. Obtener productos y determinar producto vendido y materia prima bruta
    const productos = await productoService.obtenerProductos();
    const prodVendido = productos.find(p => p.id_producto === venta.id_producto);
    if (!prodVendido) {
      throw new Error(`Producto con ID ${venta.id_producto} no encontrado.`);
    }

    const prodMateriaPrima = productos.find(p => {
      const nom = p.nombre.toLowerCase();
      const pres = p.presentacion.toLowerCase();
      return nom.includes('granel') || nom.includes('materia prima') || pres.includes('balde') || pres.includes('25 kg') || pres.includes('granel');
    }) || productos.find(p => p.id_producto === 5);

    const esMateriaPrimaDirecta = prodMateriaPrima && prodVendido.id_producto === prodMateriaPrima.id_producto;
    const pesoNominalUnitarioKg = extraerPesoNominalKg(prodVendido.presentacion);
    const pesoTotalMateriaPrimaKg = pesoNominalUnitarioKg * venta.cantidad;

    // 2. Validar stock disponible de materia prima bruta si no es la venta directa de granel
    if (!esMateriaPrimaDirecta && prodMateriaPrima) {
      const stockMateriaPrima = await inventarioService.consultarStock(prodMateriaPrima.id_producto);
      if (stockMateriaPrima < pesoTotalMateriaPrimaKg) {
        throw new Error(
          `Stock de Materia Prima en Bruto insuficiente: Se requieren ${pesoTotalMateriaPrimaKg.toFixed(2)} KG de Miel en Bruto para cubrir ${venta.cantidad} unid. de ${prodVendido.nombre} (${prodVendido.presentacion}), pero solo hay ${stockMateriaPrima.toFixed(2)} KG disponibles en almacén.`
        );
      }
    }

    // 3. Descontar stock del producto envasado vendido
    await inventarioService.registrarSalida(
      venta.id_producto,
      venta.cantidad,
      venta.fecha,
      `Venta comercial a ${venta.cliente || 'Cliente'}`
    );

    // 4. Descuento cruzado de la Materia Prima Bruta (Kardex en KG) si corresponde
    if (!esMateriaPrimaDirecta && prodMateriaPrima) {
      await inventarioService.registrarSalida(
        prodMateriaPrima.id_producto,
        pesoTotalMateriaPrimaKg,
        venta.fecha,
        `Consumo de materia prima por venta de ${venta.cantidad} unid. de ${prodVendido.nombre} (${prodVendido.presentacion})`
      );
    }

    // 5. Insertar la venta en Supabase o modo local
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
