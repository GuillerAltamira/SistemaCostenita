import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  History,
  PackageCheck
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { InventarioController } from '../controllers/InventarioController';
import { ProductoController } from '../controllers/ProductoController';
import { Inventario, MovimientoInventario, Producto } from '../types/models';

export const InventarioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'existencias' | 'kardex'>('existencias');
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState<boolean>(false);
  const [isSalidaModalOpen, setIsSalidaModalOpen] = useState<boolean>(false);

  // Form State
  const [selectedProductoId, setSelectedProductoId] = useState<number>(0);
  const [cantidad, setCantidad] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const [invData, movData, prodData] = await Promise.all([
        InventarioController.consultarInventario(),
        InventarioController.obtenerMovimientos(),
        ProductoController.obtenerProductos()
      ]);
      setInventario(invData);
      setMovimientos(movData);
      setProductos(prodData);
      if (prodData.length > 0) setSelectedProductoId(prodData[0].id_producto);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEntradaModal = (prodId?: number) => {
    setSelectedProductoId(prodId || (productos.length > 0 ? productos[0].id_producto : 0));
    setCantidad('');
    setMotivo('Lote de envasado y acopio');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(null);
    setIsEntradaModalOpen(true);
  };

  const handleOpenSalidaModal = (prodId?: number) => {
    setSelectedProductoId(prodId || (productos.length > 0 ? productos[0].id_producto : 0));
    setCantidad('');
    setMotivo('Despacho comercial / Distribución');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(null);
    setIsSalidaModalOpen(true);
  };

  const handleEntradaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // HU06: Registrar Entrada
      const res = await InventarioController.registrarEntrada(
        selectedProductoId,
        parseFloat(cantidad),
        fecha,
        motivo
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarDatos();
        setTimeout(() => {
          setIsEntradaModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        setFormError(res.error || res.message);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar entrada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalidaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // HU07: Registrar Salida (con validación de stock disponible)
      const res = await InventarioController.registrarSalida(
        selectedProductoId,
        parseFloat(cantidad),
        fecha,
        motivo
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarDatos();
        setTimeout(() => {
          setIsSalidaModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        setFormError(res.error || res.message);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al procesar salida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductStock = inventario.find(i => i.id_producto === selectedProductoId)?.stock_actual || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-850 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('existencias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'existencias'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Existencias Actuales (HU08)
          </button>
          <button
            onClick={() => setActiveTab('kardex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'kardex'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Kardex de Movimientos (HU06/07)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="success"
            size="sm"
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
            onClick={() => handleOpenEntradaModal()}
          >
            Registrar Entrada (HU06)
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<ArrowDownRight className="w-4 h-4" />}
            onClick={() => handleOpenSalidaModal()}
          >
            Registrar Salida (HU07)
          </Button>
        </div>
      </div>

      {/* Tab 1: Existencias Actuales (HU08) */}
      {activeTab === 'existencias' && (
        <Card>
          <CardHeader
            title="Inventario de Existencias Físicas (HU08)"
            subtitle="Control de existencias e inalterabilidad según Código de Comercio (DL 14379)"
            icon={<Boxes className="w-5 h-5" />}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                  <th className="py-3.5 px-4">ID Prod</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Presentación</th>
                  <th className="py-3.5 px-4 text-right">Stock Actual</th>
                  <th className="py-3.5 px-4 text-center">Estado del Stock</th>
                  <th className="py-3.5 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Consultando inventario...
                    </td>
                  </tr>
                ) : inventario.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No existen productos registrados en el inventario.
                    </td>
                  </tr>
                ) : (
                  inventario.map((item) => {
                    const stock = Number(item.stock_actual);
                    const isLow = stock < 25;
                    return (
                      <tr key={item.id_inventario} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          #{item.id_producto}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {item.producto?.nombre || `Producto #${item.id_producto}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-amber-300">
                            {item.producto?.presentacion || item.unidad_medida}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-base text-slate-100">
                          {stock} <span className="text-xs font-normal text-slate-400">{item.unidad_medida}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isLow ? (
                            <Badge variant="danger" size="sm" dot>Stock Crítico (&lt; 25)</Badge>
                          ) : (
                            <Badge variant="success" size="sm" dot>Disponible</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEntradaModal(item.id_producto)}
                              title="Registrar Entrada"
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenSalidaModal(item.id_producto)}
                              title="Registrar Salida"
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Kardex de Movimientos */}
      {activeTab === 'kardex' && (
        <Card>
          <CardHeader
            title="Kardex de Movimientos de Inventario"
            subtitle="Registro inalterable de entradas y salidas de producto"
            icon={<History className="w-5 h-5" />}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4 text-center">Tipo</th>
                  <th className="py-3.5 px-4 text-right">Cantidad</th>
                  <th className="py-3.5 px-4">Motivo / Trazabilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No hay movimientos registrados en el kardex.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => {
                    const isEntrada = m.tipo === 'ENTRADA';
                    return (
                      <tr key={m.id_movimiento} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          #{m.id_movimiento}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-xs font-mono">
                          {m.fecha}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {m.producto?.nombre || `Prod #${m.id_producto}`}
                          <span className="text-xs text-slate-400 block font-normal">
                            {m.producto?.presentacion}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={isEntrada ? 'success' : 'danger'} size="sm" dot>
                            {m.tipo}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          <span className={isEntrada ? 'text-emerald-400' : 'text-rose-400'}>
                            {isEntrada ? '+' : '-'}{m.cantidad}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          {m.motivo || 'Movimiento general'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal HU06: Registrar Entrada */}
      <Modal
        isOpen={isEntradaModalOpen}
        onClose={() => setIsEntradaModalOpen(false)}
        title="Registrar Entrada de Producto (HU06)"
        subtitle="Ingreso manual de unidades al stock físico de Costeñita"
      >
        <form onSubmit={handleEntradaSubmit} className="space-y-4">
          {/* Validation Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Error en la entrada de inventario"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Entrada Confirmada!"
              message={formSuccess}
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Producto *
            </label>
            <select
              value={selectedProductoId}
              onChange={(e) => setSelectedProductoId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            >
              {productos.map((pr) => (
                <option key={pr.id_producto} value={pr.id_producto}>
                  {pr.nombre} — {pr.presentacion}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cantidad a Ingresar *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ej. 50"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo de Entrada
            </label>
            <input
              type="text"
              placeholder="Ej. Envasado de lote C-005"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEntradaModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isSubmitting}
            >
              Confirmar Entrada
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal HU07: Registrar Salida */}
      <Modal
        isOpen={isSalidaModalOpen}
        onClose={() => setIsSalidaModalOpen(false)}
        title="Registrar Salida de Producto (HU07)"
        subtitle="Validación estricta de stock disponible antes de autorizar el egreso"
      >
        <form onSubmit={handleSalidaSubmit} className="space-y-4">
          {/* Stock Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Stock Insuficiente"
              message={formError}
              details="Regla de Negocio HU07: No se permite egreso que resulte en saldo negativo de existencias."
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Salida Autorizada y Registrada!"
              message={formSuccess}
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Producto *
            </label>
            <select
              value={selectedProductoId}
              onChange={(e) => setSelectedProductoId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            >
              {productos.map((pr) => (
                <option key={pr.id_producto} value={pr.id_producto}>
                  {pr.nombre} — {pr.presentacion}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Stock Actual Disponible:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {selectedProductStock} unidades
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cantidad a Retirar *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ej. 10"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo de Salida
            </label>
            <input
              type="text"
              placeholder="Ej. Venta en mostrador, despacho a ferias"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSalidaModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmitting}
            >
              Confirmar Salida
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
