import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Calendar,
  User,
  Package,
  DollarSign,
  Scale,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { CompraController } from '../controllers/CompraController';
import { ProveedorController } from '../controllers/ProveedorController';
import { ProductoController } from '../controllers/ProductoController';
import { Compra, Proveedor, Producto, UnidadMedida } from '../types/models';

export const ComprasView: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State (HU04)
  const [idProveedor, setIdProveedor] = useState<number>(0);
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<string>('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>('KG');
  const [precioUnitario, setPrecioUnitario] = useState<string>('28.00');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState<string>('');

  // Alerts State
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const [compData, provData, prodData] = await Promise.all([
        CompraController.obtenerCompras(),
        ProveedorController.obtenerProveedores(),
        ProductoController.obtenerProductos()
      ]);
      setCompras(compData);
      setProveedores(provData);
      setProductos(prodData);

      if (provData.length > 0 && idProveedor === 0) setIdProveedor(provData[0].id_proveedor);
      if (prodData.length > 0 && idProducto === 0) setIdProducto(prodData[0].id_producto);
    } catch (err) {
      console.error('Error cargando datos de compras:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (proveedores.length > 0) setIdProveedor(proveedores[0].id_proveedor);
    if (productos.length > 0) setIdProducto(productos[0].id_producto);
    setCantidad('25.00');
    setUnidadMedida('KG');
    setPrecioUnitario('28.00');
    setFecha(new Date().toISOString().split('T')[0]);
    setObservaciones('Miel pura de monte chaqueño cosechada en floración de algarrobo');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const cantNum = parseFloat(cantidad);
    const precioNum = parseFloat(precioUnitario) || 0;

    try {
      // Llamada a CompraController (HU04 - Registrar Compra con Afectación Automática a Inventario)
      const res = await CompraController.registrarCompra(
        idProveedor,
        idProducto,
        cantNum,
        unidadMedida,
        fecha,
        precioNum,
        observaciones
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarDatos();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
        }, 1400);
      } else {
        setFormError(res.error || res.message);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado al registrar la compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = productos.find(p => p.id_producto === idProducto);
  const selectedProveedor = proveedores.find(p => p.id_proveedor === idProveedor);
  const cantNum = parseFloat(cantidad) || 0;
  const precioNum = parseFloat(precioUnitario) || 0;
  const totalCalculado = cantNum * precioNum;

  const totalInvertido = compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const totalKilosAcopiados = compras.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Acopiado</p>
            <p className="text-2xl font-extrabold text-amber-400">Bs. {totalInvertido.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400">Inversión en apicultores locales</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Materia Prima en Peso</p>
            <p className="text-2xl font-extrabold text-emerald-400">{totalKilosAcopiados.toFixed(1)} <span className="text-sm font-semibold text-slate-300">Kg/Unid</span></p>
            <p className="text-[11px] text-slate-400">Acopiado y envasado</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Órdenes de Compra</p>
            <p className="text-2xl font-extrabold text-sky-400">{compras.length}</p>
            <p className="text-[11px] text-slate-400">Con entrada automática al Kardex</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Acopio y Compra de Miel de Abeja (Villa Montes)
          </h3>
          <p className="text-xs text-slate-400">
            Regla de Negocio HU04: Toda compra registrada ingresa automáticamente como &apos;ENTRADA&apos; sumando al stock de inventario.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={cargarDatos}
          >
            Actualizar
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenModal}
          >
            Registrar Compra (HU04)
          </Button>
        </div>
      </div>

      {/* Compras Table */}
      <Card>
        <CardHeader
          title="Historial de Compras de Materia Prima y Miel"
          subtitle={`Total de ${compras.length} órdenes registradas y auditadas para SENASAG`}
          icon={<ShoppingCart className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/60">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Apicultor / Proveedor</th>
                <th className="py-3.5 px-4">Producto & Presentación</th>
                <th className="py-3.5 px-4 text-right">Cantidad</th>
                <th className="py-3.5 px-4 text-right">Precio Unitario</th>
                <th className="py-3.5 px-4 text-right">Total (Bs.)</th>
                <th className="py-3.5 px-4 text-center">Estado & Kardex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <p className="text-xs">Consultando compras de materia prima...</p>
                    </div>
                  </td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-300">No hay compras registradas</p>
                      <p className="text-xs text-slate-500">
                        Inicia el acopio registrando una compra de miel con el botón superior.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                compras.map((c) => (
                  <tr key={c.id_compra} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{c.id_compra}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {c.fecha}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">
                        {c.proveedor?.nombre || `Proveedor #${c.id_proveedor}`}
                      </div>
                      <div className="text-xs text-slate-400">
                        {c.proveedor?.localidad || 'Villa Montes'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">
                        {c.producto?.nombre || `Producto #${c.id_producto}`}
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-amber-300 font-mono mt-0.5">
                        <Tag className="w-3 h-3" />
                        {c.producto?.presentacion || c.unidad_medida}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      {c.cantidad} <span className="text-xs font-normal text-slate-400">{c.unidad_medida}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      Bs. {Number(c.precio_unitario || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-400">
                      Bs. {Number(c.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="success" size="sm" dot>
                          {c.estado}
                        </Badge>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                          <ArrowUpRight className="w-3 h-3" /> +Stock HU04
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal HU04: Registrar Compra de Miel */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Compra de Miel (HU04)"
        subtitle="Acopio de materia prima con afectación automática e inmediata al stock físico de inventario"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation / Business Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Verifique los datos de la compra"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Compra Confirmada!"
              message={formSuccess}
            />
          )}

          {/* Selector de Proveedor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Apicultor / Proveedor *
              </span>
              <span className="text-[11px] font-normal text-slate-400">Ley 830 SENASAG</span>
            </label>
            <select
              value={idProveedor}
              onChange={(e) => {
                setIdProveedor(Number(e.target.value));
                if (formError) setFormError(null);
              }}
              required
              className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-100 focus:outline-none transition-colors ${
                formError && !idProveedor
                  ? 'border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-slate-700 focus:border-amber-400'
              }`}
            >
              {proveedores.length === 0 ? (
                <option value={0}>No hay proveedores registrados. Registre uno primero en HU03.</option>
              ) : (
                proveedores.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre} — {p.localidad} (Tel: {p.telefono})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Selector de Producto y Presentación Dinámica */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Producto o Tipo de Miel *
              </span>
              <span className="text-[11px] font-normal text-amber-300">
                Presentación: {selectedProduct?.presentacion || 'Seleccione producto'}
              </span>
            </label>
            <select
              value={idProducto}
              onChange={(e) => setIdProducto(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
            >
              {productos.length === 0 ? (
                <option value={0}>No hay productos disponibles. Registre uno en HU01.</option>
              ) : (
                productos.map((pr) => (
                  <option key={pr.id_producto} value={pr.id_producto}>
                    {pr.nombre} — [{pr.presentacion}]
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Cantidad y Unidad de Medida (KG / GRAMOS / UNIDAD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Cantidad Acopiada *</span>
                <span className="text-[11px] font-normal text-emerald-400">&gt; 0</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ej. 25.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Unidad de Medida (Peso) *
              </label>
              <select
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value as UnidadMedida)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              >
                <option value="KG">KG (Kilogramos)</option>
                <option value="GRAMOS">GRAMOS (g)</option>
                <option value="UNIDAD">UNIDAD (Balde / Envase)</option>
              </select>
            </div>
          </div>

          {/* Costo Unitario y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Costo Unitario (Bs.) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                placeholder="28.00"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Fecha de Compra *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Observaciones / Trazabilidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Observaciones / Trazabilidad y Origen Floral
            </label>
            <input
              type="text"
              placeholder="Ej. Cosecha floración de algarrobo y quebracho, lote C-102"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Automatic Inventory Rule Notification */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <ArrowUpRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">Afectación Automática de Inventario (HU04 / HU06)</p>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Al confirmar la compra de <span className="font-mono font-bold text-white">{cantNum} {unidadMedida}</span> de <span className="font-semibold text-white">&quot;{selectedProduct?.nombre || 'Producto'}&quot;</span> a <span className="font-semibold text-white">{selectedProveedor?.nombre || 'Apicultor'}</span>, el sistema creará inmediatamente un registro <span className="font-mono font-bold text-white">&apos;ENTRADA&apos;</span> en el Kardex y sumará la cantidad al inventario disponible.
              </p>
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Total a Liquidar al Apicultor:</span>
              <span className="text-[11px] text-slate-400">
                {cantNum} {unidadMedida} × Bs. {precioNum.toFixed(2)}
              </span>
            </div>
            <span className="text-xl font-extrabold text-amber-400 font-mono">
              Bs. {totalCalculado.toFixed(2)}
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
              Confirmar Compra y Afectar Inventario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
