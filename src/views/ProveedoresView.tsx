import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { ProveedorController } from '../controllers/ProveedorController';
import { Proveedor } from '../types/models';

const LOCALIDADES_CHACO = [
  'El Palmar - Villa Montes',
  'Ibibobo - Gran Chaco',
  'Tarairí - Villa Montes',
  'Caigua - Villa Montes',
  'Puesto Uno - Villa Montes',
  'San Antonio - Pilcomayo',
  'Villa Montes Centro'
];

export const ProveedoresView: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [localidad, setLocalidad] = useState<string>('');

  // Alerts State (Flujo Principal y Flujos de Extensión HU03)
  const [formError, setFormError] = useState<string | null>(null);
  const [formDuplicateError, setFormDuplicateError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    setIsLoading(true);
    try {
      const data = await ProveedorController.obtenerProveedores();
      setProveedores(data);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setNombre('');
    setTelefono('');
    setLocalidad('El Palmar - Villa Montes');
    setFormError(null);
    setFormDuplicateError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormDuplicateError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      // Llamada a ProveedorController (HU03 - Validación y Verificación de Duplicados)
      const res = await ProveedorController.registrarProveedor(nombre, telefono, localidad);

      if (res.success) {
        setFormSuccess(res.message);
        await cargarProveedores();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess(null);
        }, 1200);
      } else {
        if (res.message.includes('ya existe') || (res.error && res.error.includes('Ya existe'))) {
          // Flujo de Extensión: Proveedor Duplicado por teléfono (PlantUML HU03)
          setFormDuplicateError(res.error || res.message);
        } else {
          // Flujo de Extensión: Datos Inválidos
          setFormError(res.error || res.message);
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error inesperado al registrar el proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.localidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telefono.includes(searchTerm)
  );

  const localidadesUnicas = new Set(proveedores.map(p => p.localidad)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Apicultores Registrados</p>
            <p className="text-2xl font-extrabold text-slate-100">{proveedores.length}</p>
            <p className="text-[11px] text-slate-400">Proveedores de acopio</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Comunidades Chaqueñas</p>
            <p className="text-2xl font-extrabold text-emerald-400">{localidadesUnicas}</p>
            <p className="text-[11px] text-slate-400">Puntos de acopio en Gran Chaco</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cumplimiento Legal</p>
            <p className="text-sm font-bold text-slate-200 mt-1">Ley N° 830 SENASAG</p>
            <p className="text-[11px] text-slate-400">Trazabilidad de origen apícola</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por apicultor, teléfono o localidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={cargarProveedores}
            title="Recargar lista desde Supabase"
          >
            Actualizar
          </Button>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenModal}
        >
          Registrar Apicultor (HU03)
        </Button>
      </div>

      {/* Grid of Apicultores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Consultando registro de apicultores...</p>
            </div>
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <div className="max-w-sm mx-auto space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-300">No se encontraron apicultores</p>
              <p className="text-xs text-slate-500">
                No hay resultados para &quot;{searchTerm}&quot;. Puedes registrar uno nuevo con el botón superior.
              </p>
            </div>
          </div>
        ) : (
          proveedoresFiltrados.map((prov) => (
            <Card key={prov.id_proveedor} hoverEffect className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                    ID #{prov.id_proveedor}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-100 mb-2 line-clamp-1">
                  {prov.nombre}
                </h4>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono text-slate-200">{prov.telefono}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                      UNIQUE
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 font-medium">{prov.localidad}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Badge variant="success" size="sm" dot>Inocuidad SENASAG</Badge>
                </span>
                <span className="font-mono">Bolivia 🇧🇴</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal HU03: Registrar Proveedor / Apicultor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Apicultor / Proveedor (HU03)"
        subtitle="Alta de apicultor local para acopio y trazabilidad de origen apícola"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Duplicate Phone Alert (Flujo de Extensión - Rojo) */}
          {formDuplicateError && (
            <Alert
              variant="error"
              title="El proveedor ya existe"
              message={formDuplicateError}
              details="Regla 3FN: El número de teléfono debe ser único por cada apicultor."
              onClose={() => setFormDuplicateError(null)}
            />
          )}

          {/* Validation Error Alert (Rojo) */}
          {formError && (
            <Alert
              variant="error"
              title="Complete los datos obligatorios"
              message={formError}
              onClose={() => setFormError(null)}
            />
          )}

          {/* Success Alert (Verde) */}
          {formSuccess && (
            <Alert
              variant="success"
              title="¡Registro Exitoso!"
              message={formSuccess}
            />
          )}

          {/* Field: Nombre (Obligatorio) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Nombre Completo o Asociación *</span>
              <span className="text-[11px] font-normal text-slate-400">Obligatorio</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Don Mateo Benítez, ASOAPI Gran Chaco"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (formError || formDuplicateError) {
                  setFormError(null);
                  setFormDuplicateError(null);
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                formError && !nombre.trim()
                  ? 'border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-slate-700 focus:border-amber-400'
              }`}
            />
          </div>

          {/* Field: Teléfono (Obligatorio - Restricción UNIQUE) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Teléfono / Celular de Contacto *</span>
              <span className="text-[11px] font-normal text-amber-400">Único (3FN)</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 72981234, 71894562"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                if (formError || formDuplicateError) {
                  setFormError(null);
                  setFormDuplicateError(null);
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors font-mono ${
                formError && !telefono.trim()
                  ? 'border-rose-500 ring-1 ring-rose-500/50'
                  : 'border-slate-700 focus:border-amber-400'
              }`}
            />
          </div>

          {/* Field: Localidad (Obligatorio) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Comunidad / Localidad *</span>
              <span className="text-[11px] font-normal text-emerald-400">Villa Montes / Tarija</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. El Palmar - Villa Montes, Ibibobo"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />

            {/* Quick Localidad Chips */}
            <div className="mt-2">
              <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Comunidades chaqueñas frecuentes:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOCALIDADES_CHACO.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocalidad(loc)}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${
                      localidad === loc
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
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
              Guardar Apicultor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
