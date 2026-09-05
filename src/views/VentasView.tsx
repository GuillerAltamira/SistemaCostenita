import React, { useState, useEffect, useMemo } from 'react';
import {
  BadgeDollarSign,
  ShoppingBag,
  User,
  Scale,
  Layers,
  AlertTriangle,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Store,
  MessageCircle,
  MapPin,
  Truck,
  RotateCcw,
  Sparkles,
  PackageCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { VentaController } from '../controllers/VentaController';
import { ProductoController } from '../controllers/ProductoController';
import { InventarioController } from '../controllers/InventarioController';
import { Venta, Producto, Inventario, CanalVenta } from '../types/models';
import {
  calcularPesoEquivalenteKg,
  esProductoComercial,
  encontrarMateriaPrimaBruta
} from '../services/ventaService';

const CANALES_VENTA: { id: CanalVenta; label: string; icon: React.ReactNode; color: string }[] = [
  {
    id: 'Venta Mostrador',
    label: 'Venta Mostrador',
    icon: <Store className="w-3.5 h-3.5" />,
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  },
  {
    id: 'WhatsApp / Pedido Local',
    label: 'WhatsApp / Pedido Local',
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'Feria Local / Mercado',
    label: 'Feria Local / Mercado',
    icon: <MapPin className="w-3.5 h-3.5" />,
    color: 'border-sky-500/40 bg-sky-500/10 text-sky-300'
  },
  {
    id: 'Distribuidor / Tienda',
    label: 'Distribuidor / Tienda',
    icon: <Truck className="w-3.5 h-3.5" />,
    color: 'border-purple-500/40 bg-purple-500/10 text-purple-300'
  }
];

export const VentasView: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State (HU09, HU10, HU11)
  const [cliente, setCliente] = useState<string>('Cliente Mostrador');
  const [canal, setCanal] = useState<CanalVenta>('Venta Mostrador');
  const [idProducto, setIdProducto] = useState<number>(0);
  const [cantidad, setCantidad] = useState<string>('1');
  const [precioUnitario, setPrecioUnitario] = useState<string>('45.00');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);

  // UI Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filters State (HU12)
  const [busquedaCliente, setBusquedaCliente] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroCanal, setFiltroCanal] = useState<string>('TODOS');

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

      // Filtrar exclusivamente productos comerciales envasados (HU09)
      const prodsEnvasados = prodData.filter(esProductoComercial);
      if (prodsEnvasados.length > 0) {
        // Si no hay producto seleccionado o el actual ya no es válido
        if (idProducto === 0 || !prodsEnvasados.some(p => p.id_producto === idProducto)) {
          setIdProducto(prodsEnvasados[0].id_producto);
          setPrecioUnitario(String(prodsEnvasados[0].precio_venta || 45.00));
        }
      }
    } catch (err) {
      console.error('Error cargando datos de ventas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Productos comerciales terminados exclusivos (excluye granel / baldes)
  const productosComerciales = useMemo(() => {
    return productos.filter(esProductoComercial);
  }, [productos]);

  // Identificar el producto seleccionado y su stock
  const selectedProd = productos.find(p => p.id_producto === idProducto);
  const stockEnvasadoDisponible = inventario.find(i => i.id_producto === idProducto)?.stock_actual || 0;

  // Localizar la materia prima bruta (miel a granel)
  const prodMateriaPrima = useMemo(() => {
    return encontrarMateriaPrimaBruta(productos);
  }, [productos]);

  const stockMateriaPrimaDisponible = prodMateriaPrima
    ? (inventario.find(i => i.id_producto === prodMateriaPrima.id_producto)?.stock_actual || 0)
    : 0;

  // Cálculos reactivos en tiempo real
  const cantNum = parseInt(cantidad, 10) || 0;
  const precioNum = parseFloat(precioUnitario) || 0;
  const totalVentaCalc = cantNum > 0 && precioNum > 0 ? cantNum * precioNum : 0;

  // HU09 - Paso B: Calcular peso equivalente en KG consumido
  const pesoTotalKgConsumido = selectedProd && cantNum > 0
    ? calcularPesoEquivalenteKg(selectedProd.presentacion, cantNum)
    : 0;

  // Validaciones reactivas de stock
  const errorStockEnvasado = cantNum > stockEnvasadoDisponible;
  const errorStockMateriaPrima = pesoTotalKgConsumido > stockMateriaPrimaDisponible;

  const handleSelectProduct = (prodId: number) => {
    setIdProducto(prodId);
    const prod = productos.find(p => p.id_producto === prodId);
    if (prod && typeof prod.precio_venta === 'number') {
      setPrecioUnitario(String(prod.precio_venta.toFixed(2)));
    }
  };

  const handleResetForm = () => {
    setCliente('Cliente Mostrador');
    setCanal('Venta Mostrador');
    if (productosComerciales.length > 0) {
      setIdProducto(productosComerciales[0].id_producto);
      setPrecioUnitario(String(productosComerciales[0].precio_venta || 45.00));
    }
    setCantidad('1');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmitVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validaciones preventivas de frontend
    if (cantNum <= 0) {
      setFormError('La cantidad a vender debe ser un número entero mayor que 0.');
      return;
    }
    if (precioNum <= 0) {
      setFormError('El precio unitario debe ser mayor a 0 Bs.');
      return;
    }
    if (errorStockEnvasado) {
      setFormError(`Stock insuficiente del producto envasado (${stockEnvasadoDisponible} uds disponibles).`);
      return;
    }
    if (errorStockMateriaPrima) {
      setFormError('Stock insuficiente de miel bruta acopiada para cubrir el lote vendido');
      return;
    }

    setIsSubmitting(true);

    try {
      // HU09, HU10, HU11: Registrar Venta con Descuento Cruzado de Materia Prima y Canal
      const res = await VentaController.registrarVenta(
        cliente,
        canal,
        idProducto,
        cantNum,
        precioNum,
        fecha
      );

      if (res.success) {
        setFormSuccess(res.message);
        await cargarDatos();

        // Resetear formulario manteniendo defaults
        setTimeout(() => {
          setCantidad('1');
          setCliente('Cliente Mostrador');
          setCanal('Venta Mostrador');
          if (selectedProd) {
            setPrecioUnitario(String(selectedProd.precio_venta || 45.00));
          }
          setFormSuccess(null);
        }, 3000);
      } else {
        setFormError(res.error || res.message);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado al registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HU12: Filtrado dinámico del historial de ventas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      // Búsqueda rápida por cliente
      const coincideCliente =
        !busquedaCliente.trim() ||
        v.cliente.toLowerCase().includes(busquedaCliente.toLowerCase().trim());

      // Filtro por fecha
      const coincideFecha = !filtroFecha || v.fecha === filtroFecha;

      // Filtro por canal
      const coincideCanal = filtroCanal === 'TODOS' || v.canal === filtroCanal;

      return coincideCliente && coincideFecha && coincideCanal;
    });
  }, [ventas, busquedaCliente, filtroFecha, filtroCanal]);

  // Resumen métrico del historial
  const totalMontoVentas = useMemo(() => {
    return ventasFiltradas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  }, [ventasFiltradas]);

  const totalUnidadesVendidas = useMemo(() => {
    return ventasFiltradas.reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0);
  }, [ventasFiltradas]);

  const totalMielDeducidaKg = useMemo(() => {
    return ventasFiltradas.reduce((acc, v) => {
      const pres = v.producto?.presentacion || '';
      return acc + calcularPesoEquivalenteKg(pres, Number(v.cantidad) || 0);
    }, 0);
  }, [ventasFiltradas]);

  // Helper para renderizar badge de canal
  const renderCanalBadge = (canalNombre?: string) => {
    const info = CANALES_VENTA.find(c => c.id === canalNombre) || CANALES_VENTA[0];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${info.color}`}>
        {info.icon}
        <span>{info.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-2">
            <span>🍯 Módulo Comercial</span>
            <span>•</span>
            <span>HU09, HU10, HU11, HU12</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Ventas Comerciales y Despacho de Miel
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
            Registro de venta de productos terminados envasados con cálculo en tiempo real, asignación de canales comerciales (HU11) y deducción cruzada automática del lote de miel bruta en almacén (HU09).
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FORMULARIO DE REGISTRO DE VENTA (HU09, HU10, HU11)                     */}
      {/* ========================================================================= */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 shadow-xl shadow-amber-950/20">
        <CardHeader
          title="Registro de Nueva Venta Comercial"
          subtitle="Formulario oficial de despacho — Deducción cruzada de materia prima en tiempo real"
          icon={<BadgeDollarSign className="w-5 h-5 text-amber-400" />}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetForm}
            >
              Limpiar Campos
            </Button>
          }
        />

        <form onSubmit={handleSubmitVenta} className="p-6 space-y-6">
          {/* Mensajes de Alerta Reactivos */}
          {formError && (
            <Alert
              variant="error"
              title="Error en la validación de venta"
              message={formError}
              details="Verifique que exista suficiente stock envasado y suficiente miel en bruto acopiada para cubrir el peso de los frascos."
              onClose={() => setFormError(null)}
            />
          )}

          {formSuccess && (
            <Alert
              variant="success"
              title="¡Transacción Completada con Éxito!"
              message={formSuccess}
              details="El inventario de frascos y el kardex de materia prima se han actualizado y sincronizado reactivamente con el Dashboard."
              onClose={() => setFormSuccess(null)}
            />
          )}

          {/* Fila 1: Cliente (HU10) y Canal de Venta (HU11) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cliente HU10 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Cliente (HU10) *</span>
              </label>
              <input
                type="text"
                required
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder='Ej. "Farmacia Natural Chaqueña" o "Cliente Mostrador"'
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Por defecto: "Cliente Mostrador". Puede ingresar nombres de tiendas, farmacias o particulares.
              </p>
            </div>

            {/* Canal de Venta HU11 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Canal de Venta (HU11) *</span>
              </label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value as CanalVenta)}
                required
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-medium cursor-pointer"
              >
                {CANALES_VENTA.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Canal comercial de comercialización obligatoria para trazabilidad y segmentación.
              </p>
            </div>
          </div>

          {/* Fila 2: Producto Envasado (HU09 - Filtrado Exclusivo de Productos Terminados) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Producto Envasado Terminado (HU09) *</span>
              </span>
              {selectedProd && (
                <span className="text-xs text-amber-300 font-mono flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  Equivalencia de envasado: {calcularPesoEquivalenteKg(selectedProd.presentacion, 1)} KG por unidad
                </span>
              )}
            </label>
            <select
              value={idProducto}
              onChange={(e) => handleSelectProduct(Number(e.target.value))}
              required
              className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-medium cursor-pointer"
            >
              {productosComerciales.map((pr) => (
                <option key={pr.id_producto} value={pr.id_producto}>
                  {pr.nombre} — [{pr.presentacion}] • Precio sugerido: Bs. {(pr.precio_venta || 0).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Selector exclusivo de presentaciones envasadas para consumo final (frascos de 250 g, 500 g, 1 kg). La materia prima a granel en baldes está protegida.
            </p>
          </div>

          {/* Indicadores de Stock en Vivo: Envasado vs Materia Prima Bruta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stock Envasado */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                errorStockEnvasado
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${errorStockEnvasado ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400">Stock Frascos Disponibles</p>
                    <p className="text-sm font-semibold text-slate-100">
                      {selectedProd?.presentacion || 'Presentación'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold font-mono ${errorStockEnvasado ? 'text-rose-400' : 'text-amber-400'}`}>
                    {stockEnvasadoDisponible}
                  </span>
                  <span className="text-xs text-slate-400 block">unidades</span>
                </div>
              </div>
            </div>

            {/* Stock Miel Bruta Acopiada */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                errorStockMateriaPrima
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${errorStockMateriaPrima ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400">Stock Miel en Bruto (Acopio)</p>
                    <p className="text-sm font-semibold text-slate-100">
                      {prodMateriaPrima?.nombre || 'Miel a Granel / Materia Prima'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold font-mono ${errorStockMateriaPrima ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Number(stockMateriaPrimaDisponible).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 block">KG en almacén</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencia dinámica si hay stock insuficiente */}
          {(errorStockEnvasado || errorStockMateriaPrima) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {errorStockEnvasado
                  ? `Stock insuficiente del producto envasado (${stockEnvasadoDisponible} uds disponibles).`
                  : `Stock insuficiente de miel bruta acopiada para cubrir el lote vendido (se requieren ${pesoTotalKgConsumido.toFixed(2)} KG y hay ${stockMateriaPrimaDisponible.toFixed(2)} KG en almacén).`}
              </span>
            </div>
          )}

          {/* Fila 3: Cantidad, Precio Unitario y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Cantidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Cantidad a Vender (Uds) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-base font-bold text-slate-100 font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Unidades enteras (&gt; 0)</p>
            </div>

            {/* Precio Unitario */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Precio Unitario (Bs.) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                required
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-base font-mono font-bold text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Editable para descuentos comerciales autorizados</p>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Fecha de Transacción *</span>
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Fecha de despacho comercial</p>
            </div>
          </div>

          {/* Panel de Cálculo Reactivo y Trazabilidad de Materia Prima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deducción Cruzada en KG */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-emerald-300 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  Deducción Cruzada en Kardex (KG):
                </span>
                <p className="text-xs text-emerald-400/90">
                  {cantNum} uds × {calcularPesoEquivalenteKg(selectedProd?.presentacion || '', 1)} KG ={' '}
                  <strong className="text-emerald-200">{pesoTotalKgConsumido.toFixed(2)} KG</strong> de miel bruta consumida
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400 block">
                  -{pesoTotalKgConsumido.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">KG Miel Bruta</span>
              </div>
            </div>

            {/* Total a Cobrar en Bs. */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Total a Cobrar al Cliente:
                </span>
                <p className="text-xs text-slate-400">
                  Cálculo reactivo: {cantNum} uds × Bs. {precioNum.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 block">
                  Bs. {totalVentaCalc.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] font-semibold text-amber-300">Moneda Nacional (BOB)</span>
              </div>
            </div>
          </div>

          {/* Botón de Confirmación de Venta */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Al confirmar, se generarán automáticamente las salidas de frascos y la deducción de miel bruta en el inventario.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={errorStockEnvasado || errorStockMateriaPrima || cantNum <= 0 || isSubmitting}
                className="w-full sm:w-auto px-8"
              >
                Confirmar Venta y Descontar Stock
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* ========================================================================= */}
      {/* 2. HISTORIAL Y CONSULTA DE VENTAS REALIZADAS (HU12)                        */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* KPI Cards del Historial */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Ventas Filtradas</p>
            <p className="text-2xl font-black text-slate-100 mt-1 font-mono">
              {ventasFiltradas.length} <span className="text-xs font-normal text-slate-500">transacciones</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-between">
              <span>Monto Total Cobrado</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1 font-mono">
              Bs. {totalMontoVentas.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Unidades Despachadas</p>
            <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {totalUnidadesVendidas} <span className="text-xs font-normal text-slate-500">frascos</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Miel Bruta Deducida</p>
            <p className="text-2xl font-black text-sky-400 mt-1 font-mono">
              {totalMielDeducidaKg.toFixed(2)} <span className="text-xs font-normal text-slate-500">KG</span>
            </p>
          </div>
        </div>

        {/* Tabla de Historial con Buscador y Filtro por Fecha */}
        <Card>
          <CardHeader
            title="Historial de Ventas Realizadas (HU12)"
            subtitle={`Registro auditable de ${ventasFiltradas.length} ventas con trazabilidad completa`}
            icon={<FileSpreadsheet className="w-5 h-5 text-amber-400" />}
          />

          {/* Barra de Filtros y Búsqueda */}
          <div className="p-4 border-b border-slate-800 bg-slate-850/40 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Buscador Rápido por Nombre de Cliente */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar venta por nombre de cliente o comercio..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {busquedaCliente && (
                <button
                  type="button"
                  onClick={() => setBusquedaCliente('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filtro por Fecha */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                />
              </div>

              {filtroFecha && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltroFecha('')}
                  className="text-xs"
                >
                  Todas las fechas
                </Button>
              )}

              {/* Filtro por Canal */}
              <div className="relative">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={filtroCanal}
                  onChange={(e) => setFiltroCanal(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                >
                  <option value="TODOS">Todos los Canales</option>
                  {CANALES_VENTA.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/60">
                  <th className="py-3.5 px-4 font-mono">ID</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Canal de Venta</th>
                  <th className="py-3.5 px-4">Presentación Vendida</th>
                  <th className="py-3.5 px-4 text-right">Cantidad</th>
                  <th className="py-3.5 px-4 text-right">P. Unitario</th>
                  <th className="py-3.5 px-4 text-right">Total Cobrado</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RotateCcw className="w-5 h-5 animate-spin text-amber-400" />
                        <span>Cargando transacciones de ventas...</span>
                      </div>
                    </td>
                  </tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-300">No se encontraron ventas registradas</p>
                        <p className="text-xs text-slate-500">
                          {busquedaCliente || filtroFecha || filtroCanal !== 'TODOS'
                            ? 'Prueba modificando o limpiando los filtros de búsqueda.'
                            : 'Utilice el formulario superior para registrar la primera venta comercial.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((v) => {
                    const pesoUnit = v.producto ? calcularPesoEquivalenteKg(v.producto.presentacion, 1) : 0;
                    const pesoFilaKg = pesoUnit * Number(v.cantidad);

                    return (
                      <tr key={v.id_venta} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          #{v.id_venta}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-xs font-mono whitespace-nowrap">
                          {v.fecha}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          {v.cliente}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderCanalBadge(v.canal)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <span className="font-medium text-slate-200">
                            {v.producto?.nombre || `Producto #${v.id_producto}`}
                          </span>
                          <span className="text-xs text-amber-400 block font-mono">
                            {v.producto?.presentacion}
                            {pesoFilaKg > 0 && (
                              <span className="text-slate-400 text-[11px] ml-1.5 font-normal">
                                (-{pesoFilaKg.toFixed(2)} KG bruto)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                          {v.cantidad} uds
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                          Bs. {Number(v.precio_unitario).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-base whitespace-nowrap">
                          Bs. {Number(v.total).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge variant="success" size="sm" dot>
                            {v.estado || 'COMPLETADA'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
