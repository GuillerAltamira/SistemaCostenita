import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Boxes,
  BadgeDollarSign,
  BarChart3,
  Flame,
  ChevronRight,
  Database
} from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export type NavItemKey =
  | 'dashboard'
  | 'productos'
  | 'proveedores'
  | 'compras'
  | 'inventario'
  | 'ventas'
  | 'reportes';

interface NavItem {
  key: NavItemKey;
  label: string;
  huCode?: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      key: 'productos',
      label: 'Productos',
      huCode: 'HU01',
      icon: <Package className="w-5 h-5" />
    },
    {
      key: 'proveedores',
      label: 'Proveedores',
      huCode: 'HU03',
      icon: <Users className="w-5 h-5" />
    },
    {
      key: 'compras',
      label: 'Compras (Miel)',
      huCode: 'HU04',
      icon: <ShoppingCart className="w-5 h-5" />
    },
    {
      key: 'inventario',
      label: 'Inventario',
      huCode: 'HU06-08',
      icon: <Boxes className="w-5 h-5" />
    },
    {
      key: 'ventas',
      label: 'Ventas',
      huCode: 'HU09',
      icon: <BadgeDollarSign className="w-5 h-5" />
    },
    {
      key: 'reportes',
      label: 'Reportes & Ley',
      icon: <BarChart3 className="w-5 h-5" />
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/25">
              🍯
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-100 tracking-tight">Costeñita</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Villa Montes
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Control de Miel & Trazabilidad</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Módulos del Sistema
          </p>

          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.huCode && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.huCode}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-amber-400 opacity-80" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Database & Compliance Footer Badge */}
        <div className="p-4 m-4 rounded-2xl bg-slate-850 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Base de Datos</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-amber-400'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isSupabaseConfigured
              ? 'Conectado a Supabase Cloud (PostgreSQL 3FN).'
              : 'Modo Local / Simulación activa. Configura .env para Supabase.'}
          </p>

          <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-amber-400/90 font-medium">
            <Flame className="w-3.5 h-3.5" />
            <span>Ley 830 SENASAG & NB 38001</span>
          </div>
        </div>
      </aside>
    </>
  );
};
