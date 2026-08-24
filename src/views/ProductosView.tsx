import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  Tag,
  DollarSign,
  Info,
  RefreshCw,
  Sparkles,
  Database
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { ProductoController } from '../controllers/ProductoController';
import { Producto, EstadoProducto } from '../types/models';
import { isSupabaseConfigured } from '../services/supabaseClient';

const PRESET_PRESENTACIONES = [
  'Frasco de Vidrio 250 g',
  'Frasco de Vidrio 500 g',
  'Frasco de Vidrio 1 kg',
  'Envase PET 1 kg',
  'Balde Hermético 5 kg',
  'Balde Hermético 25 kg',
  'Frasco Gotero 30 g',
  'Frasco 200 g'
];

export const ProductosView: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [nombre, setNombre] = useState<string>('');
  const [presentacion, setPresentacion] = useState<string>('');
  const [precioVenta, setPrecioVenta] = useState<string>('35.00');
  const [descripcion, setDescripcion] = useState<string>('');
  const [estado, setEstado] = useState<EstadoProducto>('ACTIVO');

  // Alerts State (Flujo Principal y Flujos de Extensión HU01)
  const [formError, setFormError] = useState<string | null>(null);
  const [formDuplicateError, setFormDuplicateError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setIsLoading(true);
    try {
      const data = await ProductoController.obtenerProductos();
      setProductos(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setNombre('');
    setPresentacion('Frasco de Vidrio 1 kg');
    setPrecioVenta('45.00');
    setDescripcion('');
    setEstado('ACTIVO');
    setFormError(null);
    setFormDuplicateError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormDuplicateError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const precioNum = parseFloat(precioVenta);

    try {
      // Llamada al ProductoController (HU01 - Validación y Verificación de Duplicados)
      const res = await ProductoController.registrarProducto(
        nombre,
        presentacion,
        isNaN(precioNum) ? 0 : precioNum,
        descripcion,
        estado
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarProductos();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        if (res.message.includes('ya existe') || (res.error && res.error.includes('Ya existe'))) {
          // Flujo de extensión: Producto Duplicado
          setFormDuplicateError(res.error || res.message);
        } else {
          // Flujo de extensión: Datos inválidos
          setFormError(res.error || res.message);
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado al registrar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.nombre.toLowerCase().includes(term) ||
      p.presentacion.toLowerCase().includes(term) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(term));
    const matchesEstado = estadoFilter === 'TODOS' || p.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  const totalActivos = productos.filter(p => p.estado === 'ACTIVO').length;
  const precioPromedio = productos.length > 0
    ? productos.reduce((acc, p) => acc + (Number(p.precio_venta) || 0), 0) / productos.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Catálogo</p>
            <p className="text-2xl font-extrabold text-slate-100">{productos.length}</p>
            <p className="text-[11px] text-slate-400">Presentaciones de miel</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Productos Activos</p>
            <p className="text-2xl font-extrabold text-emerald-400">{totalActivos}</p>
            <p className="text-[11px] text-slate-400">Listos para venta</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Precio Promedio</p>
            <p className="text-2xl font-extrabold text-amber-300">Bs. {precioPromedio.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400">Por unidad de venta</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Persistencia</p>
            <p className="text-sm font-bold text-slate-200 mt-1">
              {isSupabaseConfigured ? 'Supabase Cloud' : 'Almacenamiento Local'}
            </p>
            <p className="text-[11px] text-slate-400">Motor 3FN Sincronizado</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, presentación o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-200 text-xs font-medium cursor-pointer"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={cargarProductos}
            title="Recargar catálogo desde Supabase"
          >
            Actualizar
          </Button>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenModal}
        >
          Registrar Producto (HU01)
        </Button>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Catálogo de Productos y Mieles de Villa Montes"
          subtitle={`Mostrando ${productosFiltrados.length} de ${productos.length} presentaciones registradas`}
          icon={<Package className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/60">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Producto & Descripción</th>
                <th className="py-3.5 px-4">Presentación (Peso)</th>
                <th className="py-3.5 px-4 text-right">Precio Venta (Bs.)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-center">Restricción 3FN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <p className="text-xs">Consultando catálogo de productos...</p>
                    </div>
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Package className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">No se encontraron productos</p>
                      <p className="text-xs text-slate-500">
                        No hay registros que coincidan con &quot;{searchTerm}&quot;. Puedes registrar uno nuevo con el botón superior.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => (
                  <tr key={prod.id_producto} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{prod.id_producto}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>🍯</span>
                        <span>{prod.nombre}</span>
                      </div>
                      {prod.descripcion && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                          {prod.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 font-mono">
                        <Tag className="w-3 h-3" />
                        {prod.presentacion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-400 text-sm">
                      Bs. {Number(prod.precio_venta || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={prod.estado === 'ACTIVO' ? 'success' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {prod.estado}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
                        UNIQUE (Nombre + Pres.)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal HU01: Registrar Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Producto (HU01)"
        subtitle="Formulario de registro y alta en el catálogo de mieles y derivados"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Duplicate Error Alert (Flujo de Extensión - Rojo/Alerta) */}
          {formDuplicateError && (
            <Alert
              variant="error"
              title="El producto ya existe"
              message={formDuplicateError}
              details="Regla 3FN: No se permite duplicar el binomio (Nombre + Presentación)."
              onClose={() => setFormDuplicateError(null)}
            />
          )}

          {/* Validation Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Complete los campos obligatorios"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Registro Exitoso!"
              message={formSuccess}
            />
          )}

          {/* Field: Nombre (Obligatorio) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Nombre del Producto *</span>
              <span className="text-[11px] font-normal text-slate-400">Obligatorio</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Miel de Monte Chaqueño Pura, Miel de Flores Silvestres"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (formError || formDuplicateError) {
                  setFormError(null);
                  setFormDuplicateError(null);
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                formError && !nombre.trim()
                  ? 'border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-slate-700 focus:border-amber-400'
              }`}
            />
          </div>

          {/* Field: Presentación (Obligatorio - En gramos o kilos) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Presentación (Peso) *</span>
              <span className="text-[11px] font-normal text-amber-400">Gramos o Kilos</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 250 g, 500 g, 1 kg, 5 kg, Balde 25 kg"
              value={presentacion}
              onChange={(e) => setPresentacion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />

            {/* Quick Preset Chips */}
            <div className="mt-2">
              <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sugerencias de presentación rápida:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PRESENTACIONES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPresentacion(preset)}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                      presentacion === preset
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field: Precio de Venta (Bs.) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Precio de Venta (Bs.) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required
                  placeholder="0.00"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Field: Estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estado del Producto
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoProducto)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="ACTIVO">ACTIVO (Habilitado para acopio y venta)</option>
                <option value="INACTIVO">INACTIVO (Deshabilitado temporalmente)</option>
              </select>
            </div>
          </div>

          {/* Field: Descripción (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Descripción / Origen Botánico</span>
              <span className="text-[11px] font-normal text-slate-400">Opcional</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Cosechada en floración de quebracho y algarrobo en Villa Montes, color ámbar brillante."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
            />
          </div>

          {/* Compliance & Help Note */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Normas IBNORCA NB 38001 y Ley N° 830: Al registrar el producto, se creará su ficha de inventario en base de datos.
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Guardar Producto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
