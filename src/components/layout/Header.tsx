import React from 'react';
import { Menu, Database, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onOpenMobileMenu: () => void;
  onQuickAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu
}) => {
  const titles: Record<NavItemKey, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel de Control Principal',
      subtitle: 'Resumen ejecutivo de acopio de miel, inventarios y ventas en Villa Montes'
    },
    productos: {
      title: 'Catálogo de Productos',
      subtitle: 'Gestión de tipos de miel y presentaciones normalizadas (HU01)'
    },
    proveedores: {
      title: 'Registro de Apicultores',
      subtitle: 'Proveedores y productores apícolas de la región del Gran Chaco (HU03)'
    },
    compras: {
      title: 'Acopio y Compras de Miel',
      subtitle: 'Registro de compra de materia prima con afectación a inventario (HU04)'
    },
    inventario: {
      title: 'Control de Inventario & Kardex',
      subtitle: 'Consulta de existencias, entradas (HU06) y salidas con validación estricta de stock (HU07)'
    },
    ventas: {
      title: 'Registro de Ventas',
      subtitle: 'Comercialización de productos y descargo de inventario (HU09)'
    },
    reportes: {
      title: 'Trazabilidad y Reportes Legales',
      subtitle: 'Cumplimiento normativo SENASAG (Ley 830) e IBNORCA (NB 38001)'
    }
  };

  const currentInfo = titles[currentTab] || {
    title: 'Sistema Costeñita',
    subtitle: 'Gestión apícola'
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger & Page Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Status Pill & Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700/80 text-xs">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300 font-medium">
              {isSupabaseConfigured ? 'Supabase Conectado' : 'Almacenamiento Local'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-200">Admin Costeñita</p>
              <p className="text-[10px] text-slate-400">Villa Montes / Tarija</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
