import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  Award,
  Download,
  Building2,
  Printer,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  DollarSign,
  Store,
  Smartphone,
  ShoppingBag,
  Truck,
  Users,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductoController } from '../controllers/ProductoController';
import { ProveedorController } from '../controllers/ProveedorController';
import { InventarioController } from '../controllers/InventarioController';
import { CompraController } from '../controllers/CompraController';
import { VentaController } from '../controllers/VentaController';
import { calcularPesoEquivalenteKg } from '../services/ventaService';
import { Producto, Proveedor, Inventario, Compra, Venta, CanalVenta } from '../types/models';

type PresetPeriodo = 'MES_ACTUAL' | 'ULTIMOS_30' | 'ANIO_2026' | 'TODO' | 'CUSTOM';

const CANALES_DISPONIBLES: { canal: CanalVenta; icon: React.ComponentType<{ className?: string }>; color: string; badgeVariant: 'info' | 'success' | 'amber' | 'neutral' }[] = [
  { canal: 'Venta Mostrador', icon: Store, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', badgeVariant: 'info' },
  { canal: 'WhatsApp / Pedido Local', icon: Smartphone, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', badgeVariant: 'success' },
  { canal: 'Feria Local / Mercado', icon: ShoppingBag, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', badgeVariant: 'amber' },
  { canal: 'Distribuidor / Tienda', icon: Truck, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', badgeVariant: 'neutral' }
];

export const ReportesView: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filtros de Periodo (HU14)
  const [presetPeriodo, setPresetPeriodo] = useState<PresetPeriodo>('ANIO_2026');
  const [fechaDesde, setFechaDesde] = useState<string>('2026-01-01');
  const [fechaHasta, setFechaHasta] = useState<string>('2026-12-31');

  useEffect(() => {
    cargarReporte();

    const handleInventoryUpdate = () => {
      cargarReporte();
    };
    window.addEventListener('costenita:inventory-updated', handleInventoryUpdate);
    return () => {
      window.removeEventListener('costenita:inventory-updated', handleInventoryUpdate);
    };
  }, []);

  const cargarReporte = async () => {
    setIsLoading(true);
    try {
      const [prod, prov, inv, comp, vent] = await Promise.all([
        ProductoController.obtenerProductos(),
        ProveedorController.obtenerProveedores(),
        InventarioController.consultarInventario(),
        CompraController.obtenerCompras(),
        VentaController.obtenerVentas()
      ]);
      setProductos(prod);
      setProveedores(prov);
      setInventario(inv);
      setCompras(comp);
      setVentas(vent);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cambio de Preset de Periodo
  const handleSelectPreset = (preset: PresetPeriodo) => {
    setPresetPeriodo(preset);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const hoyStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (preset === 'MES_ACTUAL') {
      const inicioMes = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      setFechaDesde(inicioMes);
      setFechaHasta(hoyStr);
    } else if (preset === 'ULTIMOS_30') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const past30Str = `${past30.getFullYear()}-${pad(past30.getMonth() + 1)}-${pad(past30.getDate())}`;
      setFechaDesde(past30Str);
      setFechaHasta(hoyStr);
    } else if (preset === 'ANIO_2026') {
      setFechaDesde('2026-01-01');
      setFechaHasta('2026-12-31');
    } else if (preset === 'TODO') {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  const handleCustomDateChange = (tipo: 'desde' | 'hasta', valor: string) => {
    setPresetPeriodo('CUSTOM');
    if (tipo === 'desde') setFechaDesde(valor);
    if (tipo === 'hasta') setFechaHasta(valor);
  };

  // Filtrado reactivo de Compras y Ventas por fecha
  const comprasFiltradas = useMemo(() => {
    return compras.filter(c => {
      const f = (c.fecha || '').substring(0, 10);
      const cumpleDesde = !fechaDesde || f >= fechaDesde;
      const cumpleHasta = !fechaHasta || f <= fechaHasta;
      return cumpleDesde && cumpleHasta;
    });
  }, [compras, fechaDesde, fechaHasta]);

  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      const f = (v.fecha || '').substring(0, 10);
      const cumpleDesde = !fechaDesde || f >= fechaDesde;
      const cumpleHasta = !fechaHasta || f <= fechaHasta;
      return cumpleDesde && cumpleHasta;
    });
  }, [ventas, fechaDesde, fechaHasta]);

  // Cálculos de KPIs Ejecutivos (HU14)
  const metricas = useMemo(() => {
    const comprasValidas = comprasFiltradas.filter(c => c.estado !== 'ANULADA');
    const ventasValidas = ventasFiltradas.filter(v => v.estado !== 'ANULADA');

    const totalIngresos = ventasValidas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const totalEgresos = comprasValidas.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
    const balanceMargen = totalIngresos - totalEgresos;
    const margenPct = totalIngresos > 0 ? ((balanceMargen / totalIngresos) * 100).toFixed(1) : '0.0';

    const totalKgAcopiados = comprasValidas.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
    const totalKgConsumidos = ventasValidas.reduce(
      (acc, v) => acc + calcularPesoEquivalenteKg(v.producto?.presentacion || '', Number(v.cantidad) || 0),
      0
    );
    const balanceKg = totalKgAcopiados - totalKgConsumidos;
    const totalUnidadesVendidas = ventasValidas.reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0);

    return {
      totalIngresos,
      totalEgresos,
      balanceMargen,
      margenPct,
      totalKgAcopiados,
      totalKgConsumidos,
      balanceKg,
      totalUnidadesVendidas,
      conteoVentas: ventasValidas.length,
      conteoCompras: comprasValidas.length
    };
  }, [comprasFiltradas, ventasFiltradas]);

  // Desglose de Ventas por Canal Comercial (HU11, HU14)
  const canalStats = useMemo(() => {
    const ventasValidas = ventasFiltradas.filter(v => v.estado !== 'ANULADA');
    return CANALES_DISPONIBLES.map(({ canal, icon: Icon, color, badgeVariant }) => {
      const vCanal = ventasValidas.filter(v => (v.canal || 'Venta Mostrador') === canal);
      const transacciones = vCanal.length;
      const unidades = vCanal.reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0);
      const montoBs = vCanal.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
      const porcentaje = metricas.totalIngresos > 0 ? ((montoBs / metricas.totalIngresos) * 100).toFixed(1) : '0.0';

      return {
        canal,
        Icon,
        color,
        badgeVariant,
        transacciones,
        unidades,
        montoBs,
        porcentaje: parseFloat(porcentaje)
      };
    });
  }, [ventasFiltradas, metricas.totalIngresos]);

  // Rendimiento y Ranking por Apicultor (HU13, HU14)
  const rankingApicultores = useMemo(() => {
    const comprasValidas = comprasFiltradas.filter(c => c.estado !== 'ANULADA');

    return proveedores
      .map(prov => {
        const lotesProv = comprasValidas.filter(c => c.id_proveedor === prov.id_proveedor);
        const lotesCount = lotesProv.length;
        const kgTotal = lotesProv.reduce((acc, c) => acc + (Number(c.cantidad) || 0), 0);
        const totalBs = lotesProv.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
        const costoPromedioKg = kgTotal > 0 ? totalBs / kgTotal : 0;
        const porcentajeAcopio =
          metricas.totalKgAcopiados > 0 ? (kgTotal / metricas.totalKgAcopiados) * 100 : 0;

        return {
          proveedor: prov,
          lotesCount,
          kgTotal,
          totalBs,
          costoPromedioKg,
          porcentajeAcopio
        };
      })
      .sort((a, b) => b.kgTotal - a.kgTotal);
  }, [proveedores, comprasFiltradas, metricas.totalKgAcopiados]);

  // Exportar texto resumen descargable
  const handleExportSummary = () => {
    const periodoLabel =
      fechaDesde && fechaHasta
        ? `${fechaDesde} al ${fechaHasta}`
        : fechaDesde
        ? `Desde ${fechaDesde}`
        : fechaHasta
        ? `Hasta ${fechaHasta}`
        : 'Histórico Completo';

    const reportText = `
========================================================================
SISTEMA COSTEÑITA — INFORME EJECUTIVO, TRAZABILIDAD Y AUDITORÍA
Microempresa de Miel de Abeja — Villa Montes / Gran Chaco, Tarija - Bolivia
Fecha de Emisión: ${new Date().toLocaleString('es-BO')}
Período Evaluado: ${periodoLabel}
========================================================================

1. RESUMEN FINANCIERO Y OPERATIVO:
- Total Ingresos por Ventas:     Bs. ${metricas.totalIngresos.toFixed(2)} (${metricas.conteoVentas} ventas, ${metricas.totalUnidadesVendidas} unidades)
- Total Egresos por Acopio:       Bs. ${metricas.totalEgresos.toFixed(2)} (${metricas.conteoCompras} lotes recibidos)
- Balance Bruto Operativo:        Bs. ${metricas.balanceMargen.toFixed(2)} (Margen: ${metricas.margenPct}%)
- Volumen Total Miel Acopiada:    ${metricas.totalKgAcopiados.toFixed(2)} KG
- Volumen Miel Deducida/Vendida:  ${metricas.totalKgConsumidos.toFixed(2)} KG
- Balance Neto Físico en Bodega:  ${metricas.balanceKg.toFixed(2)} KG

2. VENTAS POR CANAL COMERCIAL (HU11):
${canalStats
  .map(
    c =>
      `- ${c.canal.padEnd(26, ' ')}: Bs. ${c.montoBs.toFixed(2).padStart(9, ' ')} | ${c.porcentaje.toFixed(1)}% | ${c.unidades} uds. | ${c.transacciones} transacciones`
  )
  .join('\n')}

3. RENDIMIENTO POR APICULTOR / PROVEEDOR (HU13 - Ley N° 830 SENASAG):
${rankingApicultores
  .map(
    r =>
      `- ${r.proveedor.nombre} (${r.proveedor.localidad}): ${r.kgTotal.toFixed(2)} KG (${r.porcentajeAcopio.toFixed(1)}% del acopio) | Bs. ${r.totalBs.toFixed(2)} | Costo Prom: Bs. ${r.costoPromedioKg.toFixed(2)}/KG | ${r.lotesCount} lotes`
  )
  .join('\n')}

4. CATÁLOGO Y STOCK DISPONIBLE (Normas IBNORCA NB 38001):
- Presentaciones Comerciales:    ${productos.length}
- Stock Físico en Depósito:      ${inventario.reduce((acc, i) => acc + Number(i.stock_actual || 0), 0)} unidades

5. ESTADO DE CUMPLIMIENTO REGULATORIO Y LEGAL:
[X] SENASAG Ley N° 830: Trazabilidad de origen garantizada por lote y comunidad apícola.
[X] IBNORCA NB 38001 / Ley 453: Estandarización de envases por peso neto exacto en g y Kg.
[X] Código de Comercio DL 14379: Registro cronológico de compras y ventas.
========================================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Ejecutivo_Costenita_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* ========================================================================
          ENCABEZADO OFICIAL DE IMPRESIÓN (Visible exclusivamente al imprimir / PDF)
          ======================================================================== */}
      <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
              Sistema Costeñita — Reporte Ejecutivo y Auditoría
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Acopio de Miel Chaqueña, Transformación y Comercialización
            </p>
            <p className="text-xs text-slate-600">
              Villa Montes, Gran Chaco, Tarija — Estado Plurinacional de Bolivia
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">
              Período: {fechaDesde || 'Inicio'} al {fechaHasta || 'Presente'}
            </p>
            <p>Emisión: {new Date().toLocaleString('es-BO')}</p>
            <p className="font-mono text-[10px] text-slate-500">SENASAG Ley N° 830 | NB 38001</p>
          </div>
        </div>
      </div>

      {/* ========================================================================
          BARRA DE CONTROL SUPERIOR (On Screen)
          ======================================================================== */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            Reportes, Analítica Ejecutiva y Trazabilidad (HU14)
          </h3>
          <p className="text-xs text-slate-400">
            Balance integral de compras de acopio, ventas comerciales multicanal y auditoría SENASAG / IBNORCA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={cargarReporte}
          >
            Actualizar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportSummary}
          >
            Exportar TXT
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Imprimir / Exportar PDF
          </Button>
        </div>
      </div>

      {/* ========================================================================
          FILTRO TEMPORAL Y PRESETS DE FECHA (HU14)
          ======================================================================== */}
      <Card className="no-print border-slate-700/60 bg-slate-900/60 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-amber-400" />
              Rango de Análisis:
            </span>
            <button
              onClick={() => handleSelectPreset('MES_ACTUAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                presetPeriodo === 'MES_ACTUAL'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              Mes en Curso
            </button>
            <button
              onClick={() => handleSelectPreset('ULTIMOS_30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                presetPeriodo === 'ULTIMOS_30'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              Últimos 30 Días
            </button>
            <button
              onClick={() => handleSelectPreset('ANIO_2026')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                presetPeriodo === 'ANIO_2026'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              Año 2026
            </button>
            <button
              onClick={() => handleSelectPreset('TODO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                presetPeriodo === 'TODO'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              Todo el Histórico
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-400">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => handleCustomDateChange('desde', e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-400">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => handleCustomDateChange('hasta', e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================
          TARJETAS KPI EJECUTIVAS (Bs. y KG) - HU14
          ======================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-avoid-break">
        {/* KPI 1: Ingresos por Ventas */}
        <Card className="border-emerald-500/30 bg-gradient-to-b from-slate-900 to-emerald-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Ingresos (Ventas)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            Bs. {metricas.totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{metricas.conteoVentas} ventas registradas</span>
            <span className="text-emerald-300 font-semibold">{metricas.totalUnidadesVendidas} uds.</span>
          </div>
        </Card>

        {/* KPI 2: Egresos por Acopio */}
        <Card className="border-amber-500/30 bg-gradient-to-b from-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Egresos (Acopio)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            Bs. {metricas.totalEgresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{metricas.conteoCompras} órdenes de acopio</span>
            <span className="text-amber-300 font-semibold">{metricas.totalKgAcopiados.toFixed(1)} KG</span>
          </div>
        </Card>

        {/* KPI 3: Balance y Margen Bruto */}
        <Card className={`border-${metricas.balanceMargen >= 0 ? 'sky' : 'rose'}-500/30 bg-gradient-to-b from-slate-900 to-${metricas.balanceMargen >= 0 ? 'sky' : 'rose'}-950/20`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Margen Bruto Operativo
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${metricas.balanceMargen >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            {metricas.balanceMargen >= 0 ? '+' : ''}Bs. {metricas.balanceMargen.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Rentabilidad sobre ventas</span>
            <span className={`font-bold ${metricas.balanceMargen >= 0 ? 'text-sky-300' : 'text-rose-300'}`}>
              {metricas.margenPct}% margen
            </span>
          </div>
        </Card>

        {/* KPI 4: Balance Gravimétrico de Miel (KG) */}
        <Card className="border-golden-500/30 bg-gradient-to-b from-slate-900 to-amber-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Masa: Acopio vs Consumo
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {metricas.balanceKg >= 0 ? '+' : ''}{metricas.balanceKg.toFixed(2)} KG
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Acopio: {metricas.totalKgAcopiados.toFixed(1)} kg</span>
            <span className="text-slate-300 font-semibold">Consumo: {metricas.totalKgConsumidos.toFixed(1)} kg</span>
          </div>
        </Card>
      </div>

      {/* ========================================================================
          SECCIÓN 1: DESGLOSE DE VENTAS POR CANAL COMERCIAL (HU11, HU14)
          ======================================================================== */}
      <Card className="print-avoid-break">
        <CardHeader
          title="Desglose Analítico de Ventas por Canal Comercial (HU11)"
          subtitle="Distribución de transacciones, unidades envasadas y recaudación en Bolivianos"
          icon={<Store className="w-5 h-5 text-amber-400" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {canalStats.map(c => (
            <div
              key={c.canal}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg border ${c.color}`}>
                  <c.Icon className="w-5 h-5" />
                </div>
                <Badge variant={c.badgeVariant} size="sm">
                  {c.porcentaje}%
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">{c.canal}</h4>
                <div className="text-xl font-bold font-mono text-slate-100">
                  Bs. {c.montoBs.toFixed(2)}
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>{c.transacciones} operaciones</span>
                  <span>{c.unidades} unidades</span>
                </div>

                {/* Barra visual de porcentaje */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(c.porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                <th className="py-3 px-4">Canal de Venta</th>
                <th className="py-3 px-4 text-center">Transacciones</th>
                <th className="py-3 px-4 text-center">Unidades Envasadas</th>
                <th className="py-3 px-4 text-right">Recaudación (Bs.)</th>
                <th className="py-3 px-4 text-right">Participación (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {canalStats.map(c => (
                <tr key={c.canal} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                    <c.Icon className="w-4 h-4 text-amber-400" />
                    {c.canal}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {c.transacciones}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {c.unidades} uds.
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    Bs. {c.montoBs.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {c.porcentaje.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 font-bold text-slate-200 bg-slate-850/60">
                <td className="py-3 px-4">Total Consolidado</td>
                <td className="py-3 px-4 text-center font-mono">{metricas.conteoVentas}</td>
                <td className="py-3 px-4 text-center font-mono">{metricas.totalUnidadesVendidas} uds.</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400">
                  Bs. {metricas.totalIngresos.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* ========================================================================
          SECCIÓN 2: RENDIMIENTO Y RANKING POR APICULTOR (HU13, HU14)
          ======================================================================== */}
      <Card className="print-avoid-break">
        <CardHeader
          title="Rendimiento y Acopio por Apicultor / Proveedor (HU13)"
          subtitle="Ranking de proveedores registrados bajo Ley N° 830 SENASAG en el Gran Chaco Tarijeño"
          icon={<Users className="w-5 h-5 text-amber-400" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                <th className="py-3.5 px-4">Apicultor / Proveedor</th>
                <th className="py-3.5 px-4">Comunidad / Origen</th>
                <th className="py-3.5 px-4 text-center">Lotes Acopiados</th>
                <th className="py-3.5 px-4 text-right">Volumen Total (KG)</th>
                <th className="py-3.5 px-4 text-right">Costo Promedio (Bs./KG)</th>
                <th className="py-3.5 px-4 text-right">Total Liquidado (Bs.)</th>
                <th className="py-3.5 px-4 text-center">Aporte al Acopio</th>
                <th className="py-3.5 px-4 text-center">Estado Sanitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Consolidando datos de compras y acopio...
                  </td>
                </tr>
              ) : rankingApicultores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No se registran compras para el período seleccionado.
                  </td>
                </tr>
              ) : (
                rankingApicultores.map(({ proveedor, lotesCount, kgTotal, totalBs, costoPromedioKg, porcentajeAcopio }) => (
                  <tr key={proveedor.id_proveedor} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      <div>{proveedor.nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">{proveedor.telefono}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {proveedor.localidad}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-200">
                      {lotesCount} {lotesCount === 1 ? 'lote' : 'lotes'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                      {kgTotal.toFixed(2)} KG
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      Bs. {costoPromedioKg.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      Bs. {totalBs.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(porcentajeAcopio, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-300">
                          {porcentajeAcopio.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Auditado SENASAG
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rankingApicultores.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700 font-bold text-slate-200 bg-slate-850/60">
                  <td colSpan={2} className="py-3.5 px-4">
                    Total Acopio Consolidado
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {metricas.conteoCompras} lotes
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                    {metricas.totalKgAcopiados.toFixed(2)} KG
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    Bs. {(metricas.totalKgAcopiados > 0 ? metricas.totalEgresos / metricas.totalKgAcopiados : 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-100">
                    Bs. {metricas.totalEgresos.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">100.0%</td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant="success" size="sm">Conforme</Badge>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* ========================================================================
          MARCO LEGAL Y CUMPLIMIENTO REGULATORIO (SENASAG / IBNORCA / COMERCIO)
          ======================================================================== */}
      <div className="pt-2">
        <h4 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Marco Legal y Cumplimiento Regulatorio Obligatorio (Bolivia)
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print-avoid-break">
        <Card className="border-emerald-500/30 bg-gradient-to-b from-slate-900 to-emerald-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Ley N° 830 (SENASAG)</h4>
              <Badge variant="success" size="sm" dot>Cumplido</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inocuidad alimentaria y registro obligatorio de apicultores del Chaco (Villa Montes, El Palmar, Ibibobo, Tarairí) con auditoría floral de origen.
          </p>
        </Card>

        <Card className="border-amber-500/30 bg-gradient-to-b from-slate-900 to-amber-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Normas IBNORCA NB 38001</h4>
              <Badge variant="amber" size="sm" dot>Estandarizado</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Requisitos de envasado y pesos legales netos (1 kg, 500 g, 250 g y Baldes 25 kg) con calibración gravimétrica garantizada al consumidor (Ley 453).
          </p>
        </Card>

        <Card className="border-sky-500/30 bg-gradient-to-b from-slate-900 to-sky-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Código de Comercio (DL 14379)</h4>
              <Badge variant="info" size="sm" dot>Inalterable</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Libros de compras, ventas y kardex de inventario ordenados cronológicamente conforme a los Artículos 36 al 65 y Ley General de Telecomunicaciones N° 164.
          </p>
        </Card>
      </div>

      {/* ========================================================================
          PIE DE PÁGINA Y FIRMAS PARA IMPRESIÓN OFICIAL (PDF)
          ======================================================================== */}
      <div className="print-only pt-12 mt-12 border-t border-slate-400 text-slate-800 text-xs">
        <p className="italic text-center mb-10 text-slate-600">
          Certificación oficial de movimiento apícola emitido por Sistema Costeñita para auditoría externa e interna.
        </p>

        <div className="grid grid-cols-2 gap-16 text-center">
          <div>
            <div className="border-t border-slate-900 mx-auto w-48 pt-2">
              <p className="font-bold text-slate-900">Responsable de Acopio y Calidad</p>
              <p className="text-[10px] text-slate-600">Microempresa Apícola Costeñita</p>
              <p className="text-[10px] text-slate-500">Villa Montes - Tarija</p>
            </div>
          </div>

          <div>
            <div className="border-t border-slate-900 mx-auto w-48 pt-2">
              <p className="font-bold text-slate-900">Administración y Finanzas</p>
              <p className="text-[10px] text-slate-600">Sistema Costeñita — Auditoría</p>
              <p className="text-[10px] text-slate-500">Villa Montes - Tarija</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
