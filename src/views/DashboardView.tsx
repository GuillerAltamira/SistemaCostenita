import React, { useEffect, useState } from 'react';
import {
  Package,
  Users,
  ShoppingCart,
  Boxes,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProveedorController } from '../controllers/ProveedorController';
import { CompraController } from '../controllers/CompraController';
import { InventarioController } from '../controllers/InventarioController';
import { VentaController } from '../controllers/VentaController';
import { Inventario, MovimientoInventario, Compra, Venta } from '../types/models';
import { NavItemKey } from '../components/layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [totalProveedores, setTotalProveedores] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [invData, movData, compData, ventData, provData] = await Promise.all([
        InventarioController.consultarInventario(),
        InventarioController.obtenerMovimientos(),
        CompraController.obtenerCompras(),
        VentaController.obtenerVentas(),
        ProveedorController.obtenerProveedores()
      ]);

      setInventario(invData);
      setMovimientos(movData.slice(0, 5));
      setCompras(compData);
      setVentas(ventData);
      setTotalProveedores(provData.length);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  };

  const totalStock = inventario.reduce((acc, item) => acc + Number(item.stock_actual), 0);
  const productosBajoStock = inventario.filter(item => Number(item.stock_actual) < 25);
  const totalComprasMonto = compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const totalVentasMonto = ventas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-slate-900 border border-amber-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <span>🐝 Microempresa Costeñita</span>
              <span>•</span>
              <span>Villa Montes / Gran Chaco</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">
              Control Integral de Acopio, Inventario y Comercialización de Miel
            </h2>
            <p className="text-sm text-slate-300">
              Cumplimiento con trazabilidad apícola (Ley N° 830 SENASAG y Norma Boliviana NB 38001).
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => onNavigate('compras')}
            >
              Registrar Compra (HU04)
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Boxes className="w-4 h-4" />}
              onClick={() => onNavigate('inventario')}
            >
              Movimientos (HU06/07)
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Stock Total en Almacén"
          value={`${totalStock.toLocaleString()} uds`}
          subtitle={`${inventario.length} presentaciones activas`}
          icon={<Boxes className="w-6 h-6" />}
          colorScheme="amber"
        />
        <StatCard
          title="Apicultores / Proveedores"
          value={totalProveedores}
          subtitle="Red de acopio Villa Montes"
          icon={<Users className="w-6 h-6" />}
          colorScheme="sky"
        />
        <StatCard
          title="Acopio de Miel (Compras)"
          value={`Bs. ${totalComprasMonto.toLocaleString()}`}
          subtitle={`${compras.length} órdenes registradas`}
          icon={<ShoppingCart className="w-6 h-6" />}
          colorScheme="purple"
        />
        <StatCard
          title="Ventas Comerciales"
          value={`Bs. ${totalVentasMonto.toLocaleString()}`}
          subtitle={`${ventas.length} despachos completados`}
          icon={<TrendingUp className="w-6 h-6" />}
          colorScheme="emerald"
        />
      </div>

      {/* Stock Alert Banner if any */}
      {productosBajoStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">
                Alerta de Reabastecimiento de Miel ({productosBajoStock.length} productos con stock crítico)
              </p>
              <p className="text-xs text-slate-400">
                {productosBajoStock.map(p => p.producto?.nombre ? `${p.producto.nombre} (${p.producto.presentacion}): ${p.stock_actual} uds` : '').filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('inventario')}
          >
            Revisar Stock
          </Button>
        </div>
      )}

      {/* Split Cards: Inventory Status & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Summary (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Existencias Actuales por Presentación (HU08)"
              subtitle="Stock en tiempo real verificado en base de datos 3FN"
              icon={<Package className="w-5 h-5" />}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('inventario')}
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Ver Todo
                </Button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400">
                    <th className="pb-3 px-2">Producto</th>
                    <th className="pb-3 px-2">Presentación</th>
                    <th className="pb-3 px-2 text-right">Stock Actual</th>
                    <th className="pb-3 px-2 text-center">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {inventario.slice(0, 5).map((item) => {
                    const stock = Number(item.stock_actual);
                    const isLow = stock < 25;
                    return (
                      <tr key={item.id_inventario} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-2 font-semibold text-slate-200">
                          {item.producto?.nombre || `Producto #${item.id_producto}`}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {item.producto?.presentacion || item.unidad_medida}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-100">
                          {stock} {item.unidad_medida}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {isLow ? (
                            <Badge variant="danger" size="sm" dot>Bajo</Badge>
                          ) : (
                            <Badge variant="success" size="sm" dot>Óptimo</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Kardex Activity (1 col) */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader
                title="Movimientos Recientes"
                subtitle="Últimos registros de entrada y salida"
                icon={<Boxes className="w-5 h-5" />}
              />

              <div className="space-y-3">
                {movimientos.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No hay movimientos registrados.</p>
                ) : (
                  movimientos.map((mov) => {
                    const isEntrada = mov.tipo === 'ENTRADA';
                    return (
                      <div
                        key={mov.id_movimiento}
                        className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-lg ${
                              isEntrada
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isEntrada ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">
                              {mov.producto?.nombre || `Prod #${mov.id_producto}`}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {mov.fecha} • {mov.motivo || mov.tipo}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`font-bold ${
                            isEntrada ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isEntrada ? '+' : '-'}{mov.cantidad}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => onNavigate('inventario')}
              >
                Ver Kardex Completo
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
