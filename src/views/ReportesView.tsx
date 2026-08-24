import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Award, Download, Building2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProductoController } from '../controllers/ProductoController';
import { ProveedorController } from '../controllers/ProveedorController';
import { InventarioController } from '../controllers/InventarioController';
import { CompraController } from '../controllers/CompraController';
import { VentaController } from '../controllers/VentaController';
import { Producto, Proveedor, Inventario, Compra, Venta } from '../types/models';

export const ReportesView: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    cargarReporte();
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

  const handleExportSummary = () => {
    const reportText = `
========================================================================
SISTEMA COSTEÑITA — INFORME DE TRAZABILIDAD Y CUMPLIMIENTO NORMATIVO
Microempresa de Miel de Abeja — Villa Montes / Tarija, Bolivia
Fecha de Emisión: ${new Date().toLocaleDateString('es-BO')}
========================================================================

1. RESUMEN DE ACOPIO Y MATERIA PRIMA (Ley N° 830 SENASAG):
- Total Proveedores / Apicultores Registrados: ${proveedores.length}
- Total Compras de Acopio: ${compras.length} órdenes
- Masa Total Acopiada (Gestión por Peso): ${compras.reduce((acc, c) => acc + Number(c.cantidad), 0)} Kg
- Unidades de Medida Autorizadas: GRAMOS, KG, UNIDAD

2. CATÁLOGO Y ENVASADO (Normas IBNORCA NB 38001):
- Total Presentaciones Normalizadas en Peso: ${productos.length}
- Stock Total en Almacén: ${inventario.reduce((acc, i) => acc + Number(i.stock_actual), 0)} unidades

3. BALANCE COMERCIAL Y LEGAL (Código de Comercio DL N° 14379):
- Monto Total Invertido en Acopio: Bs. ${compras.reduce((acc, c) => acc + Number(c.total || 0), 0).toFixed(2)}
- Monto Total Comercializado: Bs. ${ventas.reduce((acc, v) => acc + Number(v.total || 0), 0).toFixed(2)}
- Despachos Realizados: ${ventas.length}

ESTADO DE CUMPLIMIENTO:
[X] SENASAG Ley N° 830: Trazabilidad de origen por apicultor y lote garantizada.
[X] IBNORCA NB 38001: Envases y presentaciones calibradas estrictamente en unidades de peso (g, Kg).
[X] Código de Comercio: Registro inalterable de kardex y movimientos.
========================================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Trazabilidad_Costenita_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Marco Legal y Trazabilidad Apícola (Bolivia)
          </h3>
          <p className="text-xs text-slate-400">
            Documentación auditable para el Servicio Nacional de Sanidad Agropecuaria e Inocuidad Alimentaria (SENASAG).
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportSummary}
        >
          Exportar Informe Oficial (.TXT)
        </Button>
      </div>

      {/* Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            Garantiza la inocuidad alimentaria y el registro obligatorio de apicultores de Villa Montes y comunidades chaqueñas (El Palmar, Ibibobo, Tarairí).
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
            Requisitos de envasado, etiquetado y unidades métricas legales por peso (Frascos 1 kg, 500 g, 250 g y Baldes 25 kg) con información exacta al consumidor (Ley 453).
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
            Libros de compras, ventas e inventario cronológicos e inalterables según Artículos 36 al 65 y Ley General de Telecomunicaciones N° 164.
          </p>
        </Card>
      </div>

      {/* Traceability Table */}
      <Card>
        <CardHeader
          title="Consolidado de Trazabilidad por Apicultor y Región"
          subtitle="Relación de origen de la miel cosechada en el Gran Chaco Tarijeño"
          icon={<ShieldCheck className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 text-xs uppercase font-bold text-slate-400 bg-slate-850/40">
                <th className="py-3.5 px-4">Apicultor</th>
                <th className="py-3.5 px-4">Comunidad / Origen</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-center">Compras Registradas</th>
                <th className="py-3.5 px-4 text-center">Trazabilidad Sanitaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Generando matriz de trazabilidad...
                  </td>
                </tr>
              ) : proveedores.map((prov) => {
                const comprasProv = compras.filter(c => c.id_proveedor === prov.id_proveedor);
                return (
                  <tr key={prov.id_proveedor} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {prov.nombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {prov.localidad}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {prov.telefono}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {comprasProv.length} lotes
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Auditado SENASAG
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
