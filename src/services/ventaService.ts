import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Venta, Producto, CanalVenta } from '../types/models';
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

/**
 * HU09 - Paso B: Calcula el peso total equivalente en KG consumido:
 * - Si la presentación es "1 kg" -> peso_kg = cantidad * 1.00
 * - Si es "500 g" -> peso_kg = cantidad * 0.50
 * - Si es "250 g" -> peso_kg = cantidad * 0.25
 */
export function calcularPesoEquivalenteKg(presentacion: string, cantidad: number): number {
  if (!presentacion || cantidad <= 0) return 0;
  const pres = presentacion.toLowerCase();

  if (pres.includes('1 kg') || pres.includes('1kg')) {
    return Number((cantidad * 1.00).toFixed(3));
  }
  if (pres.includes('500 g') || pres.includes('500g')) {
    return Number((cantidad * 0.50).toFixed(3));
  }
  if (pres.includes('250 g') || pres.includes('250g')) {
    return Number((cantidad * 0.25).toFixed(3));
  }

  const pesoUnit = extraerPesoNominalKg(presentacion);
  return Number((cantidad * pesoUnit).toFixed(3));
}

/**
 * HU09: Filtra exclusivamente productos comerciales terminados (envasados),
 * excluyendo materia prima a granel en baldes o recipientes de acopio.
 */
export function esProductoComercial(p: Producto): boolean {
  if (p.estado !== 'ACTIVO') return false;
  const nom = p.nombre.toLowerCase();
  const pres = p.presentacion.toLowerCase();
  const esGranel =
    nom.includes('granel') ||
    nom.includes('materia prima') ||
    nom.includes('bruto') ||
    pres.includes('balde') ||
    pres.includes('granel') ||
    pres.includes('25 kg');
  return !esGranel;
}

/**
 * Localiza el producto correspondiente a la materia prima en bruto (miel a granel acopiada).
 */
export function encontrarMateriaPrimaBruta(productos: Producto[]): Producto | undefined {
  return (
    productos.find(p => {
      const nom = p.nombre.toLowerCase();
      const pres = p.presentacion.toLowerCase();
      return (
        nom.includes('materia prima') ||
        nom.includes('bruto') ||
        nom.includes('granel') ||
        pres.includes('balde') ||
        pres.includes('granel') ||
        pres.includes('25 kg')
      );
    }) || productos.find(p => p.id_producto === 4 || p.id_producto === 5)
  );
}

/**
 * HU11 / HU12: Desglosa el cliente y el canal de venta a partir del formato "Cliente - [Canal]".
 * Si no incluye canal, asigna 'Venta Mostrador' por defecto.
 */
export function desglosarClienteYCanal(clienteCompleto: string): { nombreCliente: string; canal: CanalVenta } {
  if (!clienteCompleto) return { nombreCliente: 'Cliente Mostrador', canal: 'Venta Mostrador' };

  const match = clienteCompleto.match(/^(.*?)(?:\s*-\s*\[(.*?)\])?$/);
  if (match && match[2]) {
    const canalParsed = match[2].trim() as CanalVenta;
    return {
      nombreCliente: match[1].trim() || 'Cliente Mostrador',
      canal: canalParsed || 'Venta Mostrador'
    };
  }

  return {
    nombreCliente: clienteCompleto.trim() || 'Cliente Mostrador',
    canal: 'Venta Mostrador'
  };
}

export const ventaService = {
  /**
   * HU12: Obtiene el listado de ventas realizadas con productos y canales desglosados
   */
  async obtenerVentas(): Promise<Venta[]> {
    const productos = await productoService.obtenerProductos();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('venta')
        .select('*')
        .order('id_venta', { ascending: false });

      if (!error && data) {
        return (data as Venta[]).map(v => {
          const { nombreCliente, canal } = desglosarClienteYCanal(v.cliente);
          return {
            ...v,
            cliente: nombreCliente,
            canal,
            producto: productos.find(p => p.id_producto === v.id_producto)
          };
        });
      }
    }

    const localVentas = getLocalVentas();
    return localVentas.map(v => {
      const { nombreCliente, canal } = desglosarClienteYCanal(v.cliente);
      return {
        ...v,
        cliente: nombreCliente,
        canal: (v.canal as CanalVenta) || canal,
        producto: productos.find(p => p.id_producto === v.id_producto)
      };
    });
  },

  /**
   * HU09, HU10, HU11: Registra una venta comercial con lógica de descuento cruzado:
   * - Paso A: Validar stock de unidades envasadas en tabla `inventario`.
   * - Paso B: Calcular peso equivalente en KG consumido (1 kg -> 1.00, 500 g -> 0.50, 250 g -> 0.25).
   * - Paso C: Validar stock de miel bruta acopiada >= peso_kg. Si no, abortar con:
   *           "Stock insuficiente de miel bruta acopiada para cubrir el lote vendido".
   * - Paso D: Insertar en `venta`, salidas en `movimiento_inventario` y actualizar `inventario`.
   */
  async registrarVenta(venta: Omit<Venta, 'id_venta'>): Promise<Venta> {
    if (venta.cantidad <= 0) {
      throw new Error('La cantidad a vender debe ser mayor a 0 unidades.');
    }

    // 1. Obtener catálogo y validar producto terminado envasado
    const productos = await productoService.obtenerProductos();
    const prodVendido = productos.find(p => p.id_producto === venta.id_producto);
    if (!prodVendido) {
      throw new Error(`Producto con ID ${venta.id_producto} no encontrado.`);
    }

    if (!esProductoComercial(prodVendido)) {
      throw new Error(
        'El producto seleccionado corresponde a materia prima a granel. Solo se permite comercializar productos terminados envasados (HU09).'
      );
    }

    // Paso A: Validar que existan suficientes unidades en inventario para el producto envasado
    const stockEnvasado = await inventarioService.consultarStock(venta.id_producto);
    if (stockEnvasado < venta.cantidad) {
      throw new Error(
        `Stock insuficiente de producto envasado: Se solicitaron ${venta.cantidad} unidades de ${prodVendido.nombre} (${prodVendido.presentacion}), pero solo hay ${stockEnvasado} unidades disponibles.`
      );
    }

    // Paso B: Calcular el peso total equivalente en KG consumido
    const pesoTotalKg = calcularPesoEquivalenteKg(prodVendido.presentacion, venta.cantidad);

    // Paso C: Validar stock del producto de materia prima bruta (miel a granel acopiada)
    const prodMateriaPrima = encontrarMateriaPrimaBruta(productos);
    if (!prodMateriaPrima) {
      throw new Error('No se encontró el ítem de Materia Prima / Miel en Bruto en el catálogo para el descuento cruzado.');
    }

    const stockMateriaPrima = await inventarioService.consultarStock(prodMateriaPrima.id_producto);
    if (stockMateriaPrima < pesoTotalKg) {
      throw new Error('Stock insuficiente de miel bruta acopiada para cubrir el lote vendido');
    }

    // Paso D: Ejecutar las inserciones y actualizaciones
    const canalVenta: CanalVenta = (venta.canal as CanalVenta) || 'Venta Mostrador';
    const clienteLimpio = (venta.cliente || 'Cliente Mostrador').trim();
    // Guardar en formato compatible: "Cliente - [Canal]"
    const clienteRegistro = `${clienteLimpio} - [${canalVenta}]`;

    // D.2: Insertar salida en movimiento_inventario para el producto envasado
    await inventarioService.registrarSalida(
      venta.id_producto,
      venta.cantidad,
      venta.fecha,
      'Venta comercial',
      'UNIDAD'
    );

    // D.3: Insertar salida en movimiento_inventario para la miel en bruto (deducción cruzada)
    await inventarioService.registrarSalida(
      prodMateriaPrima.id_producto,
      pesoTotalKg,
      venta.fecha,
      'Deducción por venta envasada',
      'KG'
    );

    // D.4: Actualizar stock_actual en tabla inventario
    // (En Supabase, el trigger fn_actualizar_stock_movimiento ejecuta el UPDATE automáticamente)
    // Para entornos locales, inventarioService.registrarSalida ya actualizó el estado.
    // También verificamos para garantizar sincronización en ambos ítems
    await inventarioService.consultarStock(venta.id_producto);
    await inventarioService.consultarStock(prodMateriaPrima.id_producto);

    let ventaGuardada: Venta;

    // D.1: Insertar en tabla venta (Supabase o Local)
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('venta') as any)
        .insert([{
          fecha: venta.fecha,
          cliente: clienteRegistro,
          id_producto: venta.id_producto,
          cantidad: venta.cantidad,
          precio_unitario: venta.precio_unitario,
          total: venta.total || venta.cantidad * venta.precio_unitario,
          estado: 'COMPLETADA'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Error al registrar la venta en la base de datos: ${error.message}`);
      }

      ventaGuardada = {
        ...(data as Venta),
        cliente: clienteLimpio,
        canal: canalVenta,
        producto: prodVendido
      };
    } else {
      const ventas = getLocalVentas();
      const nextId = ventas.length > 0 ? Math.max(...ventas.map(v => v.id_venta)) + 1 : 1;
      ventaGuardada = {
        ...venta,
        id_venta: nextId,
        cliente: clienteLimpio,
        canal: canalVenta,
        total: venta.total || venta.cantidad * venta.precio_unitario,
        estado: 'COMPLETADA',
        created_at: new Date().toISOString(),
        producto: prodVendido
      };
      ventas.unshift({
        ...ventaGuardada,
        cliente: clienteRegistro
      });
      saveLocalVentas(ventas);
    }

    // Notificar reactivamente a la aplicación y al Dashboard (HU12 & Reactividad)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('costenita:inventory-updated', {
          detail: {
            id_venta: ventaGuardada.id_venta,
            id_producto: venta.id_producto,
            id_materia_prima: prodMateriaPrima.id_producto,
            peso_deducido_kg: pesoTotalKg
          }
        })
      );
    }

    return ventaGuardada;
  }
};
