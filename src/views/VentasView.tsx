import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Plus, ShoppingBag, User } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { VentaController } from '../controllers/VentaController';
import { ProductoController } from '../controllers/ProductoController';
import { InventarioController } from '../controllers/InventarioController';
import { Venta, Producto, Inventario } from '../types/models';

export const VentasView: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [cliente, setCliente] = useState<string>('Cliente Mostrador Villa Montes');
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<string>('1');
  const [precioUnitario, setPrecioUnitario] = useState<string>('45.00');
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
      const [ventData, prodData, invData] = await Promise.all([
        VentaController.obtenerVentas(),
        ProductoController.obtenerProductos(),
        InventarioController.consultarInventario()
      ]);
      setVentas(ventData);
      setProductos(prodData);
      setInventario(invData);
      if (prodData.length > 0) setIdProducto(prodData[0].id_producto);
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (productos.length > 0) setIdProducto(productos[0].id_producto);
    setCliente('Cliente Mostrador Villa Montes');
    setCantidad('1');
    setPrecioUnitario('45.00');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // HU09: Registrar Venta
      const res = await VentaController.registrarVenta(
        cliente,
        idProducto,
        parseFloat(cantidad),
        parseFloat(precioUnitario),
        fecha
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarDatos();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        setFormError(res.error || res.message);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stockDisponible = inventario.find(i => i.id_producto === idProducto)?.stock_actual || 0;
  const totalVentaCalc = (parseFloat(cantidad) || 0) * (parseFloat(precioUnitario) || 0);

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Comercialización y Ventas de Miel</h3>
          <p className="text-xs text-slate-400">
            Registro de comprobantes de venta con validación de stock y descargo automático (HU09).
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenModal}
        >
          Registrar Venta (HU09)
        </Button>
      </div>

      {/* Ventas Table */}
      <Card>
        <CardHeader
          title="Historial de Ventas Comerciales"
          subtitle={`Total de ${ventas.length} ventas despachadas`}
          icon={<BadgeDollarSign className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                <th className="py-3.5 px-4">ID Venta</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4 text-right">Cantidad</th>
                <th className="py-3.5 px-4 text-right">P. Unitario</th>
                <th className="py-3.5 px-4 text-right">Total (Bs.)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No se han registrado ventas aún.
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id_venta} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{v.id_venta}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs font-mono">
                      {v.fecha}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {v.cliente}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {v.producto?.nombre}
                      <span className="text-xs text-amber-400 block">
                        {v.producto?.presentacion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      {v.cantidad}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      Bs. {Number(v.precio_unitario).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-amber-400 text-base">
                      Bs. {Number(v.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success" size="sm" dot>
                        {v.estado}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal HU09: Registrar Venta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Venta de Miel (HU09)"
        subtitle="Verificación automática de stock antes de generar el comprobante"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation / Stock Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Error en la venta"
              message={formError}
              details="Regla de Negocio HU09: Se requiere stock disponible suficiente para concretar la venta."
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Venta Registrada Exitosamente!"
              message={formSuccess}
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Tienda El Chaqueño, Doña Martha"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              Producto a Vender *
            </label>
            <select
              value={idProducto}
              onChange={(e) => setIdProducto(Number(e.target.value))}
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
            <span className="text-slate-400">Stock Actual en Bodega:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {stockDisponible} unidades disponibles
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cantidad a Vender *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Precio Unitario (Bs.) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                required
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total a Cobrar:</span>
            <span className="text-base font-extrabold text-amber-400">
              Bs. {totalVentaCalc.toFixed(2)}
            </span>
          </div>

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
              Confirmar Venta y Descargar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
