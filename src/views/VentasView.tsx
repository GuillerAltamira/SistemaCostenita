import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, Plus, ShoppingBag, User, Scale, Layers, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { VentaController } from '../controllers/VentaController';
import { ProductoController } from '../controllers/ProductoController';
import { InventarioController } from '../controllers/InventarioController';
import { Venta, Producto, Inventario } from '../types/models';
import { extraerPesoNominalKg } from '../services/ventaService';

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
      if (prodData.length > 0) {
        setIdProducto(prodData[0].id_producto);
        setPrecioUnitario(String(prodData[0].precio_venta || 45));
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (productos.length > 0) {
      setIdProducto(productos[0].id_producto);
      setPrecioUnitario(String(productos[0].precio_venta || 45));
    }
    setCliente('Cliente Mostrador Villa Montes');
    setCantidad('1');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSelectProduct = (prodId: number) => {
    setIdProducto(prodId);
    const prod = productos.find(p => p.id_producto === prodId);
    if (prod && prod.precio_venta) {
      setPrecioUnitario(String(prod.precio_venta));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // HU09: Registrar Venta con Descuento Cruzado de Materia Prima
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

  const selectedProd = productos.find(p => p.id_producto === idProducto);
  const stockEnvasadoDisponible = inventario.find(i => i.id_producto === idProducto)?.stock_actual || 0;

  const prodMateriaPrima = productos.find(p => {
    const nom = p.nombre.toLowerCase();
    const pres = p.presentacion.toLowerCase();
    return nom.includes('granel') || nom.includes('materia prima') || pres.includes('balde') || pres.includes('25 kg') || pres.includes('granel');
  }) || productos.find(p => p.id_producto === 5);

  const stockMateriaPrimaDisponible = prodMateriaPrima ? (inventario.find(i => i.id_producto === prodMateriaPrima.id_producto)?.stock_actual || 0) : 0;
  const esMateriaPrimaDirecta = prodMateriaPrima && idProducto === prodMateriaPrima.id_producto;

  const cantNum = parseFloat(cantidad) || 0;
  const precioNum = parseFloat(precioUnitario) || 0;
  const totalVentaCalc = cantNum * precioNum;

  const pesoUnitarioKg = selectedProd ? extraerPesoNominalKg(selectedProd.presentacion) : 1.0;
  const pesoTotalKgConsumido = pesoUnitarioKg * cantNum;

  const errorStockEnvasado = cantNum > stockEnvasadoDisponible;
  const errorStockMateriaPrima = !esMateriaPrimaDirecta && (pesoTotalKgConsumido > stockMateriaPrimaDisponible);

  return (
    <div className="space-y-6">
      {/* Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Comercialización y Ventas de Miel</h3>
          <p className="text-xs text-slate-400">
            Despacho comercial de unidades envasadas con descargo cruzado automático de materia prima en bruto (HU09 / SENASAG).
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
                <th className="py-3.5 px-4">Producto & Presentación</th>
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
                      <span className="text-xs text-amber-400 block font-mono">
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
        subtitle="Verificación de stock de frascos y descuento cruzado automático de Materia Prima Bruta (KG)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation / Stock Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Error en la transacción"
              message={formError}
              details="Regla de Negocio HU09: Se requiere stock envasado y stock de materia prima bruta disponible."
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Producto Envasado a Vender *
              </span>
              <span className="text-[11px] font-normal text-amber-300 font-mono">
                Peso nominal: {pesoUnitarioKg} KG / unid.
              </span>
            </label>
            <select
              value={idProducto}
              onChange={(e) => handleSelectProduct(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400"
            >
              {productos.map((pr) => (
                <option key={pr.id_producto} value={pr.id_producto}>
                  {pr.nombre} — [{pr.presentacion}] (Bs. {pr.precio_venta || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Panel de Estado de Stock Cruzado (Envasado + Materia Prima) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              errorStockEnvasado ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-850 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-semibold text-slate-200">Stock Envasado</p>
                  <p className="text-[11px] text-slate-400">{selectedProd?.nombre}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {stockEnvasadoDisponible} uds
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              errorStockMateriaPrima ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-850 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="font-semibold text-slate-200">Stock Miel en Bruto</p>
                  <p className="text-[11px] text-slate-400">Acopio en Almacén</p>
                </div>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {stockMateriaPrimaDisponible.toFixed(1)} KG
              </span>
            </div>
          </div>

          {/* Advertencia dinámica si hay stock insuficiente */}
          {(errorStockEnvasado || errorStockMateriaPrima) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {errorStockEnvasado
                  ? `Stock insuficiente del producto envasado (${stockEnvasadoDisponible} uds dispon.).`
                  : `Materia prima en bruto insuficiente. Se requieren ${pesoTotalKgConsumido.toFixed(2)} KG y hay ${stockMateriaPrimaDisponible.toFixed(2)} KG en almacén.`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Cantidad de Unidades *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400"
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
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Live Traceability & Raw Material Consumption Preview */}
          {!esMateriaPrimaDirecta && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="flex items-center justify-between font-bold text-emerald-200">
                <span>Descuento Cruzado de Materia Prima (KG):</span>
                <span className="font-mono text-emerald-400 text-sm">
                  - {pesoTotalKgConsumido.toFixed(2)} KG
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/90">
                Fórmula de trazabilidad: {cantNum} unidades × {pesoUnitarioKg} KG ({selectedProd?.presentacion || 'gramaje'}) = <strong className="text-white">{pesoTotalKgConsumido.toFixed(2)} KG</strong> consumidos de Miel en Bruto.
              </p>
            </div>
          )}

          {/* Total Preview */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Total a Cobrar al Cliente:</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {cantNum} unid. × Bs. {precioNum.toFixed(2)}
              </span>
            </div>
            <span className="text-xl font-extrabold text-amber-400 font-mono">
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
              disabled={errorStockEnvasado || errorStockMateriaPrima}
            >
              Confirmar Venta y Descontar Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
