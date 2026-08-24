import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Inventario, MovimientoInventario, UnidadMedida } from '../types/models';
import { INITIAL_INVENTARIO, INITIAL_MOVIMIENTOS } from './mockData';
import { productoService } from './productoService';

const INVENTARIO_KEY = 'costenita_inventario';
const MOVIMIENTOS_KEY = 'costenita_movimientos';

function getLocalInventario(): Inventario[] {
  const data = localStorage.getItem(INVENTARIO_KEY);
  if (!data) {
    localStorage.setItem(INVENTARIO_KEY, JSON.stringify(INITIAL_INVENTARIO));
    return INITIAL_INVENTARIO;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_INVENTARIO;
  }
}

function saveLocalInventario(inventario: Inventario[]) {
  localStorage.setItem(INVENTARIO_KEY, JSON.stringify(inventario));
}

function getLocalMovimientos(): MovimientoInventario[] {
  const data = localStorage.getItem(MOVIMIENTOS_KEY);
  if (!data) {
    localStorage.setItem(MOVIMIENTOS_KEY, JSON.stringify(INITIAL_MOVIMIENTOS));
    return INITIAL_MOVIMIENTOS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MOVIMIENTOS;
  }
}

function saveLocalMovimientos(movimientos: MovimientoInventario[]) {
  localStorage.setItem(MOVIMIENTOS_KEY, JSON.stringify(movimientos));
}

export const inventarioService = {
  /**
   * HU08: Consultar Inventario completo junto a la información del Producto
   */
  async consultarInventario(): Promise<Inventario[]> {
    const productos = await productoService.obtenerProductos();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('id_inventario', { ascending: true });

      if (!error && data) {
        return (data as Inventario[]).map(inv => ({
          ...inv,
          producto: productos.find(p => p.id_producto === inv.id_producto)
        }));
      }
    }

    const localInv = getLocalInventario();
    // Asegurar que todos los productos tengan su registro de inventario correspondiente
    productos.forEach(prod => {
      if (!localInv.some(i => i.id_producto === prod.id_producto)) {
        localInv.push({
          id_inventario: localInv.length + 1,
          id_producto: prod.id_producto,
          stock_actual: 0,
          unidad_medida: 'UNIDAD'
        });
      }
    });
    saveLocalInventario(localInv);

    return localInv.map(inv => ({
      ...inv,
      producto: productos.find(p => p.id_producto === inv.id_producto)
    }));
  },

  /**
   * HU08: Consultar stock disponible de un producto específico
   */
  async consultarStock(idProducto: number): Promise<number> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await (supabase
        .from('inventario') as any)
        .select('stock_actual')
        .eq('id_producto', idProducto)
        .single();

      if (!error && data) {
        return Number((data as any).stock_actual);
      }
    }

    const localInv = getLocalInventario();
    const item = localInv.find(i => i.id_producto === idProducto);
    return item ? Number(item.stock_actual) : 0;
  },

  /**
   * HU06: Registrar Entrada de Producto al Inventario
   */
  async registrarEntrada(
    idProducto: number,
    cantidad: number,
    fecha: string = new Date().toISOString().split('T')[0],
    motivo: string = 'Entrada de producto',
    unidadMedida: UnidadMedida = 'UNIDAD'
  ): Promise<{ stockNuevo: number; movimiento: MovimientoInventario }> {
    if (cantidad <= 0) {
      throw new Error('La cantidad de entrada debe ser estrictamente mayor a 0');
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Insertar movimiento de entrada
      const { data: movData, error: movErr } = await (supabase
        .from('movimiento_inventario') as any)
        .insert([{
          id_producto: idProducto,
          tipo: 'ENTRADA',
          cantidad,
          unidad_medida: unidadMedida,
          fecha,
          motivo
        }])
        .select()
        .single();

      if (movErr) throw new Error(movErr.message);

      // El trigger en PostgreSQL ya actualiza el stock automáticamente, pero consultamos el valor nuevo
      const stockActualizado = await this.consultarStock(idProducto);
      return {
        stockNuevo: stockActualizado,
        movimiento: movData as MovimientoInventario
      };
    }

    // Modo Local
    const localInv = getLocalInventario();
    let item = localInv.find(i => i.id_producto === idProducto);
    if (!item) {
      item = {
        id_inventario: localInv.length + 1,
        id_producto: idProducto,
        stock_actual: 0,
        unidad_medida: unidadMedida
      };
      localInv.push(item);
    }

    item.stock_actual = Number(item.stock_actual) + Number(cantidad);
    item.unidad_medida = unidadMedida;
    item.updated_at = new Date().toISOString();
    saveLocalInventario(localInv);

    const movimientos = getLocalMovimientos();
    const nuevoMov: MovimientoInventario = {
      id_movimiento: movimientos.length + 1,
      id_producto: idProducto,
      tipo: 'ENTRADA',
      cantidad,
      unidad_medida: unidadMedida,
      fecha,
      motivo,
      created_at: new Date().toISOString()
    };
    movimientos.unshift(nuevoMov);
    saveLocalMovimientos(movimientos);

    return {
      stockNuevo: item.stock_actual,
      movimiento: nuevoMov
    };
  },

  /**
   * HU07: Registrar Salida de Producto con validación estricta de Stock
   */
  async registrarSalida(
    idProducto: number,
    cantidad: number,
    fecha: string = new Date().toISOString().split('T')[0],
    motivo: string = 'Salida de producto'
  ): Promise<{ stockNuevo: number; movimiento: MovimientoInventario }> {
    if (cantidad <= 0) {
      throw new Error('La cantidad de salida debe ser estrictamente mayor a 0');
    }

    const stockActual = await this.consultarStock(idProducto);
    if (stockActual < cantidad) {
      throw new Error(
        `Stock insuficiente: Se solicitaron ${cantidad} unidades, pero solo hay ${stockActual} disponibles en inventario.`
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { data: movData, error: movErr } = await (supabase
        .from('movimiento_inventario') as any)
        .insert([{
          id_producto: idProducto,
          tipo: 'SALIDA',
          cantidad,
          fecha,
          motivo
        }])
        .select()
        .single();

      if (movErr) throw new Error(movErr.message);

      const stockActualizado = await this.consultarStock(idProducto);
      return {
        stockNuevo: stockActualizado,
        movimiento: movData as MovimientoInventario
      };
    }

    // Modo Local
    const localInv = getLocalInventario();
    const item = localInv.find(i => i.id_producto === idProducto);
    if (!item) throw new Error('Producto no encontrado en inventario');

    item.stock_actual = Number(item.stock_actual) - Number(cantidad);
    item.updated_at = new Date().toISOString();
    saveLocalInventario(localInv);

    const movimientos = getLocalMovimientos();
    const nuevoMov: MovimientoInventario = {
      id_movimiento: movimientos.length + 1,
      id_producto: idProducto,
      tipo: 'SALIDA',
      cantidad,
      fecha,
      motivo,
      created_at: new Date().toISOString()
    };
    movimientos.unshift(nuevoMov);
    saveLocalMovimientos(movimientos);

    return {
      stockNuevo: item.stock_actual,
      movimiento: nuevoMov
    };
  },

  /**
   * Obtiene el historial de movimientos de inventario (Kardex)
   */
  async obtenerMovimientos(): Promise<MovimientoInventario[]> {
    const productos = await productoService.obtenerProductos();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('movimiento_inventario')
        .select('*')
        .order('id_movimiento', { ascending: false });

      if (!error && data) {
        return (data as MovimientoInventario[]).map(m => ({
          ...m,
          producto: productos.find(p => p.id_producto === m.id_producto)
        }));
      }
    }

    const movimientos = getLocalMovimientos();
    return movimientos.map(m => ({
      ...m,
      producto: productos.find(p => p.id_producto === m.id_producto)
    }));
  }
};
