export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      producto: {
        Row: {
          id_producto: number
          nombre: string
          presentacion: string
          precio_venta: number
          descripcion: string | null
          estado: string
          created_at?: string
        }
        Insert: {
          id_producto?: number
          nombre: string
          presentacion: string
          precio_venta?: number
          descripcion?: string | null
          estado?: string
          created_at?: string
        }
        Update: {
          id_producto?: number
          nombre?: string
          presentacion?: string
          precio_venta?: number
          descripcion?: string | null
          estado?: string
          created_at?: string
        }
      }
      proveedor: {
        Row: {
          id_proveedor: number
          nombre: string
          telefono: string
          localidad: string
          created_at?: string
        }
        Insert: {
          id_proveedor?: number
          nombre: string
          telefono: string
          localidad: string
          created_at?: string
        }
        Update: {
          id_proveedor?: number
          nombre?: string
          telefono?: string
          localidad?: string
          created_at?: string
        }
      }
      inventario: {
        Row: {
          id_inventario: number
          id_producto: number
          stock_actual: number
          unidad_medida: 'GRAMOS' | 'KG' | 'UNIDAD'
          updated_at?: string
        }
        Insert: {
          id_inventario?: number
          id_producto: number
          stock_actual?: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          updated_at?: string
        }
        Update: {
          id_inventario?: number
          id_producto?: number
          stock_actual?: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          updated_at?: string
        }
      }
      compra: {
        Row: {
          id_compra: number
          fecha: string
          cantidad: number
          unidad_medida: 'GRAMOS' | 'KG' | 'UNIDAD'
          estado: string
          id_proveedor: number
          id_producto: number
          precio_unitario: number | null
          total: number | null
          observaciones: string | null
          created_at?: string
        }
        Insert: {
          id_compra?: number
          fecha?: string
          cantidad: number
          unidad_medida: 'GRAMOS' | 'KG' | 'UNIDAD'
          estado?: string
          id_proveedor: number
          id_producto: number
          precio_unitario?: number | null
          total?: number | null
          observaciones?: string | null
          created_at?: string
        }
        Update: {
          id_compra?: number
          fecha?: string
          cantidad?: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          estado?: string
          id_proveedor?: number
          id_producto?: number
          precio_unitario?: number | null
          total?: number | null
          observaciones?: string | null
          created_at?: string
        }
      }
      movimiento_inventario: {
        Row: {
          id_movimiento: number
          id_producto: number
          tipo: string
          cantidad: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          fecha: string
          motivo: string | null
          id_referencia: number | null
          created_at?: string
        }
        Insert: {
          id_movimiento?: number
          id_producto: number
          tipo: string
          cantidad: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          fecha?: string
          motivo?: string | null
          id_referencia?: number | null
          created_at?: string
        }
        Update: {
          id_movimiento?: number
          id_producto?: number
          tipo?: string
          cantidad?: number
          unidad_medida?: 'GRAMOS' | 'KG' | 'UNIDAD'
          fecha?: string
          motivo?: string | null
          id_referencia?: number | null
          created_at?: string
        }
      }
      venta: {
        Row: {
          id_venta: number
          fecha: string
          cliente: string
          id_producto: number
          cantidad: number
          precio_unitario: number
          total: number
          estado: string
          created_at?: string
        }
        Insert: {
          id_venta?: number
          fecha?: string
          cliente?: string
          id_producto: number
          cantidad: number
          precio_unitario: number
          total: number
          estado?: string
          created_at?: string
        }
        Update: {
          id_venta?: number
          fecha?: string
          cliente?: string
          id_producto?: number
          cantidad?: number
          precio_unitario?: number
          total?: number
          estado?: string
          created_at?: string
        }
      }
    }
  }
}
