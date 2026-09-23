'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { mutateApi, uploadApi, API_ASSETS_URL } from '@/lib/api';
import ServiciosInput from './ServiciosInput';
import {
  Compass,
  Shield,
  Backpack,
  Utensils,
  Bus,
  Camera,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Plus,
  X,
  Trash2,
  UploadCloud,
  MoveLeft,
  MoveRight,
  Sparkles,
  Layers
} from 'lucide-react';

// Diccionario geográfico dinámico para Sudamérica
const SUDAMERICA_GEOGRAPHY = {
  "Perú": ["Cusco", "Lima", "Arequipa", "Puno", "Huaraz", "Iquitos"],
  "Chile": ["Santiago", "San Pedro de Atacama", "Pucón", "Puerto Natales", "Viña del Mar"],
  "Colombia": ["Bogotá", "Medellín", "Cartagena", "Santa Marta", "Cali", "San Andrés"]
};

const PREDEFINED_TAXONOMY = {
  guia: [
    "Guía local profesional en español e inglés",
    "Guía de alta montaña certificado (UIAGM)",
    "Conductor profesional con licencia de turismo",
    "Líder de expedición experto"
  ],
  seguridad: [
    "Botiquín de primeros auxilios completo",
    "Balón de oxígeno medicinal de emergencia",
    "Seguro de asistencia médica para pasajeros",
    "Radios de comunicación UHF/VHF"
  ],
  equipamiento: [
    "Ropa de abrigo o impermeable",
    "Calzado cómodo de caminata con agarre",
    "Mochila ligera para el día (de 20L a 30L)",
    "Bloqueador solar y repelente de insectos",
    "Pasaporte original o documento de identidad",
    "Botella de agua reutilizable"
  ],
  alimentacion: [
    "Almuerzo tipo Box Lunch en la ruta",
    "Desayuno buffet tradicional",
    "Cena gourmet de tres tiempos",
    "Snacks locales y frutas de estación",
    "Agua mineral y bebidas calientes"
  ],
  transporte: [
    "Transporte turístico privado de ida y vuelta",
    "Recogida y traslado de retorno al hotel",
    "Ticket de tren turístico Expedition (Ida y Vuelta)",
    "Bus de subida y bajada a la ciudadela"
  ],
  actividades: [
    "Boleto de entrada oficial a Machupicchu",
    "Entrada a las aguas termales",
    "Ticket de ingreso a sitios arqueológicos",
    "Visita guiada y tiempo libre para fotografías"
  ]
};

const CATEGORY_META = {
  guia: { label: 'Guías y Dirección', icon: Compass, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
  seguridad: { label: 'Seguridad y Asistencia', icon: Shield, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
  equipamiento: { label: 'Equipamiento Requerido', icon: Backpack, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
  alimentacion: { label: 'Alimentación y Bebidas', icon: Utensils, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
  transporte: { label: 'Transporte y Logística', icon: Bus, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
  actividades: { label: 'Tickets y Actividades', icon: Camera, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' }
};

export default function TourForm({ initialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = !!initialData;

  // Manejo de selectores de País / Ciudad a nivel global
  const [selectedPais, setSelectedPais] = useState(initialData?.pais || 'Perú');

  // ── Pestañas Bilingües y Traducciones ──
  const [langTab, setLangTab] = useState('es'); // 'es' | 'en'

  const getInitialEn = (field) => {
    if (!initialData?.traducciones) return '';
    let tr = initialData.traducciones;
    if (typeof tr === 'string') {
      try { tr = JSON.parse(tr); } catch { return ''; }
    }
    return tr?.en?.[field] || '';
  };

  const [enNombre, setEnNombre] = useState(() => getInitialEn('nombre'));
  const [enDescripcion, setEnDescripcion] = useState(() => getInitialEn('descripcion'));
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (initialData?.traducciones) {
      setEnNombre(getInitialEn('nombre'));
      setEnDescripcion(getInitialEn('descripcion'));
    }
  }, [initialData]);

  // ── Galería de Imágenes (Se queda en el bloque global superior) ──
  const [uploadedImages, setUploadedImages] = useState(() => {
    if (isEdit && initialData.imagenes) {
      if (Array.isArray(initialData.imagenes)) {
        return [...initialData.imagenes].sort((a, b) => (a.orden || 0) - (b.orden || 0));
      }
      return initialData.imagenes.split(',').map((url, index) => ({ url: url.trim(), altText: '', orden: index })).filter(img => img.url);
    }
    return [];
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Accordion local para controlar qué acordeón taxonómico se abre dentro de las variantes
  const [activeAccordion, setActiveAccordion] = useState({});

  // Inputs temporales para añadir servicios personalizados dentro de una variante específica
  const [variantCustomInputs, setVariantCustomInputs] = useState({});

  // Fechas de salida temporales por variante
  const [variantTempDates, setVariantTempDates] = useState({});

  // Normalizador de servicios incluidos para evitar fallos de taxonomía
  const normalizeServiciosIncluidos = (raw) => {
    const base = { guia: [], seguridad: [], equipamiento: [], alimentacion: [], transporte: [], actividades: [] };
    if (!raw) return base;
    let parsed = raw;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { return base; }
    }
    if (Array.isArray(parsed)) {
      return { ...base, guia: parsed };
    }
    if (typeof parsed === 'object') {
      return {
        guia: Array.isArray(parsed.guia) ? parsed.guia : [],
        seguridad: Array.isArray(parsed.seguridad) ? parsed.seguridad : [],
        equipamiento: Array.isArray(parsed.equipamiento) ? parsed.equipamiento : [],
        alimentacion: Array.isArray(parsed.alimentacion) ? parsed.alimentacion : [],
        transporte: Array.isArray(parsed.transporte) ? parsed.transporte : [],
        actividades: Array.isArray(parsed.actividades) ? parsed.actividades : [],
      };
    }
    return base;
  };

  // ── VARIANTES COMPLETA CON LOGÍSTICA, CALENDARIO Y TAXONOMÍA INDEPENDIENTE ──
  const [variantes, setVariantes] = useState(() => {
    if (isEdit && initialData.variantes && Array.isArray(initialData.variantes)) {
      return initialData.variantes.map(v => ({
        duracion_dias: v.duracion_dias || 1,
        precio_adulto: v.precio_adulto || 0,
        precio_nino: v.precio_nino || 0,
        cupos_disponibles: v.cupos_disponibles !== undefined ? v.cupos_disponibles : 10,
        fechas_disponibles: Array.isArray(v.fechas_disponibles) ? v.fechas_disponibles : [],
        servicios_incluidos: normalizeServiciosIncluidos(v.servicios_incluidos),
        servicios_excluidos: Array.isArray(v.servicios_excluidos) ? v.servicios_excluidos : [],
        itinerario: v.itinerario || ''
      }));
    }
    return [];
  });

  const handleAddVariant = () => {
    setVariantes(prev => [
      ...prev,
      {
        duracion_dias: 1,
        precio_adulto: 0,
        precio_nino: 0,
        cupos_disponibles: 10,
        fechas_disponibles: [],
        servicios_incluidos: { guia: [], seguridad: [], equipamiento: [], alimentacion: [], transporte: [], actividades: [] },
        servicios_excluidos: [],
        itinerario: ''
      }
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariantes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateVariantField = (vIdx, field, value) => {
    setVariantes(prev =>
      prev.map((v, idx) => (idx === vIdx ? { ...v, [field]: value } : v))
    );
  };

  // Funciones para gestionar fechas por variante
  const handleAddDateToVariant = (vIdx) => {
    const targetDate = variantTempDates[vIdx];
    if (targetDate) {
      setVariantes(prev =>
        prev.map((v, idx) => {
          if (idx !== vIdx) return v;
          const currentDates = Array.isArray(v.fechas_disponibles) ? v.fechas_disponibles : [];
          if (currentDates.includes(targetDate)) return v;
          return {
            ...v,
            fechas_disponibles: [...currentDates, targetDate].sort(),
          };
        })
      );
      setVariantTempDates(prev => ({ ...prev, [vIdx]: '' }));
    }
  };

  const handleRemoveDateFromVariant = (vIdx, dateStr) => {
    setVariantes(prev =>
      prev.map((v, idx) => {
        if (idx !== vIdx) return v;
        const currentDates = Array.isArray(v.fechas_disponibles) ? v.fechas_disponibles : [];
        return {
          ...v,
          fechas_disponibles: currentDates.filter(d => d !== dateStr),
        };
      })
    );
  };

  // Funciones para gestionar Plan Taxonómico por variante (Inmutabilidad completa)
  const handleTaxonomyCheckboxChange = (vIdx, catId, item) => {
    setVariantes(prev =>
      prev.map((v, idx) => {
        if (idx !== vIdx) return v;
        const currentServicios = v.servicios_incluidos ? { ...v.servicios_incluidos } : {};
        const currentArr = Array.isArray(currentServicios[catId]) ? [...currentServicios[catId]] : [];
        const updatedArr = currentArr.includes(item)
          ? currentArr.filter(x => x !== item)
          : [...currentArr, item];

        return {
          ...v,
          servicios_incluidos: {
            ...currentServicios,
            [catId]: updatedArr,
          },
        };
      })
    );
  };

  const handleAddCustomServiceToVariant = (vIdx, catId) => {
    const inputKey = `${vIdx}-${catId}`;
    const text = (variantCustomInputs[inputKey] || '').trim();
    if (text) {
      setVariantes(prev =>
        prev.map((v, idx) => {
          if (idx !== vIdx) return v;
          const currentServicios = v.servicios_incluidos ? { ...v.servicios_incluidos } : {};
          const currentArr = Array.isArray(currentServicios[catId]) ? [...currentServicios[catId]] : [];
          if (currentArr.includes(text)) return v;
          return {
            ...v,
            servicios_incluidos: {
              ...currentServicios,
              [catId]: [...currentArr, text],
            },
          };
        })
      );
      setVariantCustomInputs(prev => ({ ...prev, [inputKey]: '' }));
    }
  };

  const handleRemoveCustomServiceFromVariant = (vIdx, catId, item) => {
    setVariantes(prev =>
      prev.map((v, idx) => {
        if (idx !== vIdx) return v;
        const currentServicios = v.servicios_incluidos ? { ...v.servicios_incluidos } : {};
        const currentArr = Array.isArray(currentServicios[catId]) ? [...currentServicios[catId]] : [];
        return {
          ...v,
          servicios_incluidos: {
            ...currentServicios,
            [catId]: currentArr.filter(x => x !== item),
          },
        };
      })
    );
  };

  // React Hook Form Setup
  const defaultValues = {
    nombre: initialData?.nombre || '',
    slug: initialData?.slug || '',
    descripcion: initialData?.descripcion || '',
    activo: initialData?.activo !== undefined ? initialData?.activo : true,
    destacado: initialData?.destacado !== undefined ? initialData?.destacado : false,
    pais: initialData?.pais || 'Perú',
    categoria: initialData?.categoria || 'Trekking',
    ciudad: initialData?.ciudad || '',
    nivel_dificultad: initialData?.nivel_dificultad || 'Moderado',
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ defaultValues });

  const handleNombreChange = (e) => {
    setValue('nombre', e.target.value);
    if (!isEdit) {
      const generatedSlug = e.target.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  };

  const handleAutoTranslate = async () => {
    const currentNombre = watch('nombre');
    const currentDescripcion = watch('descripcion');

    if (!currentNombre && !currentDescripcion) {
      setError('Por favor, ingresa el Nombre o la Descripción en Español antes de auto-traducir.');
      return;
    }

    setIsTranslating(true);
    setError(null);
    try {
      const textsToTranslate = [currentNombre || '', currentDescripcion || ''];
      const res = await mutateApi('/translate', {
        method: 'POST',
        body: {
          texts: textsToTranslate,
          targetLang: 'en'
        }
      });

      if (res && res.data && Array.isArray(res.data)) {
        if (res.data[0]) setEnNombre(res.data[0]);
        if (res.data[1]) setEnDescripcion(res.data[1]);
        setLangTab('en');
      }
    } catch (err) {
      console.error('Error auto-traduciendo:', err);
      setError('No se pudo completar la traducción automática: ' + (err.message || 'Error'));
    } finally {
      setIsTranslating(false);
    }
  };

  // Manejo de carga de imágenes (Mismo comportamiento Multer+Sharp optimizado)
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImages = [...uploadedImages];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadApi('/upload', formData);
        if (res.success && res.data?.url) {
          newImages.push({
            url: res.data.url,
            altText: file.name.split('.')[0].replace(/[-_]/g, ' '),
            orden: newImages.length
          });
        }
      }
      setUploadedImages(newImages);
    } catch (err) {
      setError('Error al subir imágenes. Verifique el formato.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== index).map((img, idx) => ({ ...img, orden: idx })));
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= uploadedImages.length) return;
    const copy = [...uploadedImages];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    setUploadedImages(copy.map((img, idx) => ({ ...img, orden: idx })));
  };

  // Envío final unificado
  const onSubmit = async (data) => {
    if (uploadedImages.length === 0) {
      setError('Debes subir al menos una imagen para la galería del tour.');
      return;
    }
    if (variantes.length === 0) {
      setError('Debes agregar al menos una variante de tour (Días/Logística/Precios).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        nombre: data.nombre,
        slug: data.slug,
        descripcion: data.descripcion,
        activo: data.activo,
        destacado: data.destacado,
        pais: data.pais,
        categoria: data.categoria,
        ciudad: data.ciudad,
        nivel_dificultad: data.nivel_dificultad || 'Moderado',
        traducciones: {
          es: {
            nombre: data.nombre,
            descripcion: data.descripcion,
          },
          en: {
            nombre: enNombre?.trim() || data.nombre,
            descripcion: enDescripcion?.trim() || data.descripcion,
          },
        },
        imagenes: uploadedImages.map((img, index) => ({
          url: img.url,
          altText: img.altText || data.nombre,
          orden: index
        })),
        // Las variantes ahora se envían con toda la lógica empaquetada de manera independiente
        variantes: variantes.map(v => ({
          duracion_dias: parseInt(v.duracion_dias),
          precio_adulto: parseFloat(v.precio_adulto),
          precio_nino: parseFloat(v.precio_nino),
          cupos_disponibles: parseInt(v.cupos_disponibles),
          fechas_disponibles: v.fechas_disponibles,
          servicios_incluidos: v.servicios_incluidos,
          servicios_excluidos: v.servicios_excluidos,
          itinerario: v.itinerario || null,
        })),
      };

      if (isEdit) {
        await mutateApi(`/tours/${initialData.id}`, { method: 'PUT', body: payload });
      } else {
        await mutateApi('/tours', { method: 'POST', body: payload });
      }
      window.location.href = '/tours/';
    } catch (err) {
      setError(err.message || 'Error al guardar el tour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl pb-12">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* BLOQUE 1: INFORMACIÓN BÁSICA DEL TOUR (ESTÁTICA) */}
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#b0c4b1] pb-3">
          <h2 className="text-lg font-bold text-[#4a5759] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#4a5759]" />
            Información Básica del Tour
          </h2>

          {/* Barra de Pestañas de Idioma y Auto-traducción */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#f4f6f5] p-1 rounded-xl border border-[#b0c4b1]/60">
              <button
                type="button"
                onClick={() => setLangTab('es')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  langTab === 'es'
                    ? 'bg-[#4a5759] text-white shadow-sm'
                    : 'text-[#4a5759] hover:bg-[#b0c4b1]/20'
                }`}
              >
                <span>🇪🇸</span>
                <span>Español</span>
              </button>
              <button
                type="button"
                onClick={() => setLangTab('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  langTab === 'en'
                    ? 'bg-[#4a5759] text-white shadow-sm'
                    : 'text-[#4a5759] hover:bg-[#b0c4b1]/20'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
                {enNombre ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Traducción lista" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Sin traducción aún" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={isTranslating}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Traduce automáticamente nombre y descripción al inglés respetando términos quechua y nombres propios"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>{isTranslating ? 'Traduciendo...' : '⚡ Auto-traducir a Inglés'}</span>
            </button>
          </div>
        </div>

        {/* Campos de texto según idioma seleccionado */}
        {langTab === 'es' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-[#4a5759]">Nombre del Tour (Español) *</label>
                <input
                  type="text"
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  onChange={handleNombreChange}
                  className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
                  placeholder="Ej. Ascenso al Volcán Villarrica Activo"
                />
                {errors.nombre && <p className="text-xs text-red-400">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5759]">Slug (URL) *</label>
                <input
                  type="text"
                  {...register('slug', { required: 'El slug es obligatorio' })}
                  disabled={isEdit}
                  className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm disabled:opacity-50"
                  placeholder="ej-ascenso-al-volcan-villarrica"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#4a5759]">Descripción del Tour (Español) *</label>
              <textarea
                rows="4"
                {...register('descripcion', { required: 'La descripción es obligatoria' })}
                className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
                placeholder="Vive la experiencia inigualable de subir a pie hasta el cráter de un volcán activo..."
              ></textarea>
              {errors.descripcion && <p className="text-xs text-red-400">{errors.descripcion.message}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4 bg-emerald-500/[0.03] border border-emerald-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <span>🇬🇧</span>
                <span>Contenido en Inglés (Editable y personalizable)</span>
              </span>
              <span className="text-[11px] text-[#6c7a7c]">
                Se mostrará cuando los visitantes naveguen en inglés
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#4a5759]">Tour Name (English)</label>
              <input
                type="text"
                value={enNombre}
                onChange={(e) => setEnNombre(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
                placeholder="e.g. Active Villarrica Volcano Summit Trek"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#4a5759]">Tour Description (English)</label>
              <textarea
                rows="4"
                value={enDescripcion}
                onChange={(e) => setEnDescripcion(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
                placeholder="Experience the unique thrill of hiking to the active crater of a volcano..."
              ></textarea>
            </div>
          </div>
        )}

        {/* Clasificación y Geografía (Universal) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#b0c4b1]/30">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4a5759]">País Destino *</label>
            <select
              {...register('pais', { required: 'El país es obligatorio' })}
              onChange={(e) => {
                setSelectedPais(e.target.value);
                setValue('ciudad', SUDAMERICA_GEOGRAPHY[e.target.value][0]);
              }}
              className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
            >
              {Object.keys(SUDAMERICA_GEOGRAPHY).map(pais => (
                <option key={pais} value={pais}>{pais}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4a5759]">Ciudad Destino *</label>
            <select
              {...register('ciudad', { required: 'La ciudad es obligatoria' })}
              className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
            >
              {SUDAMERICA_GEOGRAPHY[selectedPais]?.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4a5759]">Categoría del Tour *</label>
            <select
              {...register('categoria', { required: 'La categoría es obligatoria' })}
              className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm"
            >
              <option value="Trekking">Trekking</option>
              <option value="Full Days">Full Days</option>
              <option value="Trek & Climb">Trek & Climb</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4a5759]">Nivel de Dificultad *</label>
            <select
              {...register('nivel_dificultad', { required: 'El nivel de caminata es obligatorio' })}
              className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] focus:outline-none focus:border-[#4a5759] text-sm font-semibold"
            >
              <option value="Fácil / Principiante">🟢 Fácil / Principiante</option>
              <option value="Moderado">🟡 Moderado</option>
              <option value="Exigente / Avanzado">🟠 Exigente / Avanzado</option>
              <option value="Experto / Alta Montaña">🔴 Experto / Alta Montaña</option>
            </select>
          </div>
        </div>

        {/* DRAG & DROP GALERÍA (Reubicado en Bloque 1 según requerimiento) */}
        <div className="space-y-4 pt-2">
          <label className="block text-sm font-medium text-[#4a5759]">Galería de Imágenes (Drag & Drop) *</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#b0c4b1] hover:border-[#4a5759] bg-[#ffffff] hover:bg-[#4a5759]/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group"
          >
            <input type="file" ref={fileInputRef} multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*" />
            <div className="w-12 h-12 bg-white/[0.03] group-hover:bg-[#4a5759]/10 rounded-full flex items-center justify-center border border-black/5 group-hover:border-[#4a5759]/20 text-[#6c7a7c] group-hover:text-[#4a5759]">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#4a5759]">Arrastra tus archivos de imagen aquí</p>
              <p className="text-xs text-[#6c7a7c] mt-1">O haz click para examinar desde tu explorador</p>
            </div>
            <div className="text-[10px] text-[#6c7a7c]/80 uppercase font-bold tracking-widest">Optimizado automáticamente a .webp al 80%</div>
          </div>

          {uploading && <div className="text-xs text-[#4a5759] font-bold text-center animate-pulse">Procesando y subiendo archivos...</div>}

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              {uploadedImages.map((img, index) => (
                <div key={index} className="flex gap-4 bg-[#ffffff] border border-[#b0c4b1]/60 p-3 rounded-xl relative">
                  <div className="w-16 h-16 bg-black/40 rounded-lg overflow-hidden border border-[#b0c4b1] flex-shrink-0">
                    <img 
                      src={img.url.startsWith('http') ? img.url : `${API_ASSETS_URL}${img.url.startsWith('/') ? '' : '/'}${img.url}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        if (!e.target.dataset.triedFallback) {
                          e.target.dataset.triedFallback = '1';
                          const cleanPath = img.url.startsWith('/') ? img.url : `/${img.url}`;
                          e.target.src = `https://unu-raymi.com${cleanPath}`;
                        }
                      }} 
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <input
                      type="text"
                      placeholder="Texto descriptivo (SEO)"
                      value={img.altText || ''}
                      onChange={(e) => {
                        const copy = [...uploadedImages];
                        copy[index].altText = e.target.value;
                        setUploadedImages(copy);
                      }}
                      className="bg-[#dbeafe] border border-[#b0c4b1] rounded-lg px-2 py-1 text-xs text-[#4a5759] w-full focus:outline-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="p-1 text-[#6c7a7c] disabled:opacity-20"><MoveLeft className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={index === uploadedImages.length - 1} onClick={() => moveImage(index, 1)} className="p-1 text-[#6c7a7c] disabled:opacity-20"><MoveRight className="w-3.5 h-3.5" /></button>
                      </div>
                      <button type="button" onClick={() => removeImage(index)} className="text-[#6c7a7c]/80 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOQUE 2: VARIANTES DEL TOUR ENCAPSULADAS */}
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#b0c4b1] pb-3">
          <h2 className="text-lg font-bold text-[#4a5759] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#4a5759]" />
            Configuración de Variantes del Tour
          </h2>
          <button
            type="button"
            onClick={handleAddVariant}
            className="bg-[#4a5759]/10 text-[#4a5759] hover:bg-[#4a5759] hover:text-[#4a5759] border border-[#4a5759]/20 px-4 py-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Agregar Nueva Variante
          </button>
        </div>

        {variantes.length === 0 ? (
          <div className="bg-[#ffffff] border border-[#b0c4b1]/50 rounded-2xl p-6 text-center text-xs text-[#6c7a7c]/80 italic">
            No has agregado ninguna variante. Haz clic en "Agregar Nueva Variante" para configurar los precios, calendarios y servicios por cada paquete de días.
          </div>
        ) : (
          <div className="space-y-8">
            {variantes.map((v, vIdx) => (
              <div key={vIdx} className="bg-[#ffffff]/40 border-2 border-[#b0c4b1] p-6 rounded-2xl space-y-6 relative border-t-[#4a5759]">
                <div className="flex justify-between items-center border-b border-[#b0c4b1] pb-2">
                  <span className="text-xs font-black uppercase text-[#4a5759] tracking-widest">Configuración Completa: Variante {v.duracion_dias} Día(s)</span>
                  <button type="button" onClick={() => handleRemoveVariant(vIdx)} className="text-[#6c7a7c]/80 hover:text-red-400 p-1"><Trash2 className="w-4.5 h-4.5" /></button>
                </div>

                {/* Sub-Sección A: Precios y Logística */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#4a5759] flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#4a5759]" /> Precios y Logística de la Variante</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-[#6c7a7c] mb-1">Duración (Días) *</label>
                      <input type="number" min="1" value={v.duracion_dias} onChange={(e) => handleUpdateVariantField(vIdx, 'duracion_dias', parseInt(e.target.value) || 1)} className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-xl px-3 py-2 text-[#4a5759] text-xs focus:border-[#4a5759] outline-none" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6c7a7c] mb-1">Precio Adulto (USD) *</label>
                      <input type="number" step="0.01" min="0" value={v.precio_adulto} onChange={(e) => handleUpdateVariantField(vIdx, 'precio_adulto', parseFloat(e.target.value) || 0)} className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-xl px-3 py-2 text-[#4a5759] text-xs focus:border-[#4a5759] outline-none" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6c7a7c] mb-1">Precio Niño (USD) *</label>
                      <input type="number" step="0.01" min="0" value={v.precio_nino} onChange={(e) => handleUpdateVariantField(vIdx, 'precio_nino', parseFloat(e.target.value) || 0)} className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-xl px-3 py-2 text-[#4a5759] text-xs focus:border-[#4a5759] outline-none" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#6c7a7c] mb-1">Cupos Disponibles *</label>
                      <input type="number" min="1" value={v.cupos_disponibles} onChange={(e) => handleUpdateVariantField(vIdx, 'cupos_disponibles', parseInt(e.target.value) || 1)} className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-xl px-3 py-2 text-[#4a5759] text-xs focus:border-[#4a5759] outline-none" required />
                    </div>
                  </div>
                </div>

                {/* Sub-Sección B: Calendario de Fechas Disponibles para ESTA variante */}
                <div className="space-y-3 bg-[#dbeafe]/40 p-4 rounded-xl border border-[#b0c4b1]">
                  <h4 className="text-xs font-bold text-[#4a5759] flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#4a5759]" /> Calendario de Fechas Disponibles</h4>
                  <div className="flex gap-3 items-end max-w-md">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={variantTempDates[vIdx] || ''}
                        onChange={(e) => setVariantTempDates(prev => ({ ...prev, [vIdx]: e.target.value }))}
                        className="w-full bg-[#ffffff] border border-[#b0c4b1] rounded-xl px-3 py-1.5 text-[#4a5759] text-xs focus:outline-none"
                      />
                    </div>
                    <button type="button" onClick={() => handleAddDateToVariant(vIdx)} className="bg-[#4a5759]/10 text-[#4a5759] border border-[#4a5759]/20 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4a5759] hover:text-[#4a5759] transition-all">
                      + Añadir Fecha
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {v.fechas_disponibles.length === 0 ? (
                      <span className="text-[11px] text-[#6c7a7c]/80 italic">No hay fechas asignadas a esta duración.</span>
                    ) : (
                      v.fechas_disponibles.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 bg-[#4a5759]/10 border border-[#4a5759]/30 text-[#4a5759] px-2 py-1 rounded-full text-[11px] font-medium">
                          {f}
                          <button type="button" onClick={() => handleRemoveDateFromVariant(vIdx, f)} className="text-[#4a5759] ml-1"><X className="w-3 h-3" /></button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Sub-Sección C: Plan Taxonómico de Servicios Incluidos para ESTA variante */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#4a5759] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#4a5759]" /> Plan Taxonómico: Asignación de Servicios Incluidos</h4>
                  <div className="space-y-2">
                    {Object.keys(PREDEFINED_TAXONOMY).map((catId) => {
                      const meta = CATEGORY_META[catId];
                      const Icon = meta.icon;
                      const accordionKey = `${vIdx}-${catId}`;
                      const isOpen = !!activeAccordion[accordionKey];
                      const checkedCount = v.servicios_incluidos[catId]?.length || 0;

                      const customItems = (v.servicios_incluidos[catId] || []).filter(x => !PREDEFINED_TAXONOMY[catId].includes(x));

                      return (
                        <div key={catId} className="border border-[#b0c4b1]/60 rounded-xl overflow-hidden bg-[#ffffff]">
                          <button
                            type="button"
                            onClick={() => setActiveAccordion(prev => ({ ...prev, [accordionKey]: !prev[accordionKey] }))}
                            className="w-full flex items-center justify-between p-3 bg-[#ffffff]/40 hover:bg-white text-left"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg border ${meta.color}`}><Icon className="w-3.5 h-3.5" /></div>
                              <span className="text-xs font-bold text-[#4a5759]">{meta.label} ({checkedCount})</span>
                            </div>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-[#6c7a7c]/80" /> : <ChevronDown className="w-4 h-4 text-[#6c7a7c]/80" />}
                          </button>

                          {isOpen && (
                            <div className="p-4 bg-[#dbeafe]/30 border-t border-[#b0c4b1]/30 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {PREDEFINED_TAXONOMY[catId].map((item) => {
                                  const isChecked = Array.isArray(v.servicios_incluidos?.[catId]) && v.servicios_incluidos[catId].includes(item);
                                  return (
                                    <label
                                      key={item}
                                      onClick={(e) => {
                                        if (e.target.tagName !== 'INPUT') {
                                          e.preventDefault();
                                          handleTaxonomyCheckboxChange(vIdx, catId, item);
                                        }
                                      }}
                                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer text-xs select-none transition-all duration-200 ${
                                        isChecked
                                          ? 'bg-[#4a5759] text-white border-[#4a5759] shadow-sm font-semibold'
                                          : 'bg-[#ffffff] hover:bg-[#dbeafe]/30 border-[#b0c4b1]/60 text-[#4a5759]'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleTaxonomyCheckboxChange(vIdx, catId, item)}
                                        className="mt-0.5 w-4 h-4 rounded accent-[#4a5759] cursor-pointer"
                                      />
                                      <span className="flex-1 select-none leading-tight">{item}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {customItems.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {customItems.map(item => (
                                    <span key={item} className="inline-flex items-center gap-1 bg-[#4a5759]/10 text-[#4a5759] border border-[#4a5759]/30 px-2 py-1 rounded-full text-[11px]">
                                      {item}
                                      <button type="button" onClick={() => handleRemoveCustomServiceFromVariant(vIdx, catId, item)} className="text-[#4a5759]"><X className="w-3 h-3" /></button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2 max-w-xs">
                                <input
                                  type="text"
                                  placeholder="Personalizado..."
                                  value={variantCustomInputs[`${vIdx}-${catId}`] || ''}
                                  onChange={(e) => setVariantCustomInputs(prev => ({ ...prev, [`${vIdx}-${catId}`]: e.target.value }))}
                                  className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-lg px-2.5 py-1 text-[#4a5759] text-xs outline-none"
                                />
                                <button type="button" onClick={() => handleAddCustomServiceToVariant(vIdx, catId)} className="bg-[#dedbd2] border border-[#b0c4b1] px-2.5 py-1 rounded-lg text-[11px] text-[#4a5759]">+</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Sección D: Servicios Excluidos para ESTA variante */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#4a5759] flex items-center gap-1.5"><X className="w-4 h-4 text-red-400" /> Servicios Excluidos de la Variante</h4>
                  <ServiciosInput
                    label="❌ Exclusiones Específicas"
                    items={v.servicios_excluidos}
                    onChange={(items) => handleUpdateVariantField(vIdx, 'servicios_excluidos', items)}
                    placeholder="Ej. Propinas opcionales, bebidas alcohólicas de este tramo..."
                  />
                </div>

                {/* Sub-Sección E: Itinerario Específico */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4a5759]">Itinerario Detallado para esta Duración ({v.duracion_dias} Día/s)</label>
                  <textarea
                    rows="4"
                    value={v.itinerario}
                    onChange={(e) => handleUpdateVariantField(vIdx, 'itinerario', e.target.value)}
                    placeholder="Describe el itinerario día a día detalladamente para esta variante de tiempo..."
                    className="w-full bg-[#dbeafe] border border-[#b0c4b1] rounded-xl px-3 py-2 text-[#4a5759] text-xs focus:border-[#4a5759] outline-none"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BLOQUE 3: TOGGLES DE VISIBILIDAD (ACTIVO Y DESTACADO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-black/5">
          <div>
            <span className="text-sm font-bold text-[#4a5759] block">Tour Activo</span>
            <span className="text-xs text-[#6c7a7c]/80">Determina si es visible en el catálogo de clientes.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register('activo')} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#ffffff] border border-[#b0c4b1] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4a5759] peer-checked:after:bg-white"></div>
          </label>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-black/5">
          <div>
            <span className="text-sm font-bold text-[#4a5759] block">Destacado (Home)</span>
            <span className="text-xs text-[#6c7a7c]/80">Muestra el tour con prioridad en la Landing Page.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register('destacado')} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#ffffff] border border-[#b0c4b1] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4a5759] peer-checked:after:bg-white"></div>
          </label>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => { window.location.href = '/tours/'; }}
          className="flex items-center gap-2 border border-[#b0c4b1] hover:bg-[#dedbd2] text-[#4a5759] px-6 py-3 rounded-xl transition-all text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 bg-[#4a5759] hover:bg-[#384244] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar Tour'}
        </button>
      </div>
    </form>
  );
}