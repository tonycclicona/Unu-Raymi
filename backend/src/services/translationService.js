// ==============================================================================
// translationService.js — Servicio de Traducción y Detección Multilingüe ($0 Costo)
// Detecta idioma, enmascara términos intocables (Quechua/Propios) y traduce texto
// ==============================================================================

const UNTOUCHABLE_TERMS = [
  'Machu Picchu', 'Machupicchu', 'Sacsayhuamán', 'Sacsayhuaman',
  'Ollantaytambo', 'Qorikancha', 'Coricancha', 'Pisac', 'Písac',
  'Chinchero', 'Moray', 'Salineras de Maras', 'Maras', 'Humantay',
  'Vinicunca', 'Montaña de 7 Colores', 'Rainbow Mountain',
  'Inti Raymi', 'Unu-Raymi', 'Unu Raymi', 'Cusco', 'Cuzco', 'Puno',
  'Arequipa', 'Titicaca', 'Taquile', 'Uros', 'Amantaní', 'Amantani',
  'Salkantay', 'Ausangate', 'Choquequirao', 'Valle Sagrado', 'Sacred Valley',
  'Aguas Calientes', 'Plaza de Armas', 'San Pedro', 'Tambomachay', 'Pukapukara',
  'Kenko', 'Qenqo', 'Tipón', 'Tipon', 'Pikillacta', 'Raqch\'i', 'Raqchi'
];

/**
 * Detección heurística rápida de idioma (Español vs Inglés) sin coste
 * Basada en análisis de frecuencia de palabras funcionales (stopwords).
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'es';
  const clean = text.toLowerCase();
  
  const spanishStopwords = [
    ' de ', ' la ', ' el ', ' en ', ' y ', ' a ', ' los ', ' se ', ' del ', ' las ',
    ' por ', ' un ', ' para ', ' con ', ' no ', ' una ', ' su ', ' al ', ' lo ', ' como ',
    ' más ', ' pero ', ' sus ', ' le ', ' ya ', ' o ', ' fue ', ' este ', ' ha ', ' sí '
  ];
  
  const englishStopwords = [
    ' the ', ' of ', ' and ', ' a ', ' to ', ' in ', ' is ', ' you ', ' that ', ' it ',
    ' he ', ' was ', ' for ', ' on ', ' are ', ' as ', ' with ', ' his ', ' they ', ' I ',
    ' at ', ' be ', ' this ', ' have ', ' from ', ' or ', ' one ', ' had ', ' by ', ' word '
  ];

  let esScore = 0;
  let enScore = 0;
  const padded = ` ${clean} `;

  spanishStopwords.forEach(w => { if (padded.includes(w)) esScore++; });
  englishStopwords.forEach(w => { if (padded.includes(w)) enScore++; });

  if (enScore > esScore) return 'en';
  return 'es';
}

/**
 * Traduce un texto plano preservando términos intocables mediante token masking.
 */
export async function translateWithPreservation(text, targetLang, sourceLang = null) {
  if (!text || typeof text !== 'string' || !text.trim()) return text;

  const detectedSource = sourceLang || detectLanguage(text);
  if (detectedSource === targetLang) {
    return text;
  }

  // 1. Enmascarar términos intocables
  let maskedText = text;
  const masks = [];

  UNTOUCHABLE_TERMS.forEach((term, index) => {
    // Regex segura para límite de palabras escapando caracteres especiales
    const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    if (regex.test(maskedText)) {
      const token = `__UNUTERM_${index}__`;
      masks.push({ token, original: term });
      maskedText = maskedText.replace(regex, token);
    }
  });

  // 2. Traducir usando endpoint libre de Google Translate
  try {
    const from = detectedSource || 'auto';
    const to = targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(maskedText)}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`Translation endpoint status ${response.status}`);
    }

    const data = await response.json();
    let translated = Array.isArray(data[0])
      ? data[0].map(item => item[0]).join('')
      : maskedText;

    // 3. Desenmascarar términos intocables
    masks.forEach(({ token, original }) => {
      // Tolera si el traductor agregó espacios alrededor o alteró mayúsculas en el token
      const tokenRegex = new RegExp(`\\s*${token.replace(/_/g, '[_\\s]*')}\\s*`, 'gi');
      translated = translated.replace(tokenRegex, ` ${original} `);
    });

    // Limpieza de espacios dobles resultantes del desenmascaramiento
    return translated.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.warn(`[TranslationService] Error traduciendo texto: ${err.message}. Retornando texto original.`);
    return text;
  }
}

/**
 * Traduce un arreglo de strings (ej. servicios incluidos, que llevar).
 */
export async function translateArray(arr, targetLang, sourceLang = null) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const results = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      const translated = await translateWithPreservation(item, targetLang, sourceLang);
      results.push(translated);
    } else {
      results.push(item);
    }
  }
  return results;
}

/**
 * Genera el objeto bilingüe completo { es: {...}, en: {...} } para un Tour.
 */
export async function generateBilingualTour(tourInput) {
  const sampleText = `${tourInput.nombre || ''} ${tourInput.descripcion || ''}`;
  const sourceLang = detectLanguage(sampleText);
  const targetLang = sourceLang === 'es' ? 'en' : 'es';

  // Base del idioma original
  const originalData = {
    nombre: tourInput.nombre || '',
    descripcion: tourInput.descripcion || '',
    itinerario: tourInput.itinerario || '',
    servicios_incluidos: tourInput.servicios_incluidos || [],
    servicios_excluidos: tourInput.servicios_excluidos || [],
    que_llevar: tourInput.que_llevar || [],
  };

  // Traducción al idioma opuesto
  const [
    translatedNombre,
    translatedDescripcion,
    translatedItinerario,
    translatedIncluidos,
    translatedExcluidos,
    translatedQueLlevar
  ] = await Promise.all([
    translateWithPreservation(originalData.nombre, targetLang, sourceLang),
    translateWithPreservation(originalData.descripcion, targetLang, sourceLang),
    translateWithPreservation(originalData.itinerario, targetLang, sourceLang),
    translateArray(originalData.servicios_incluidos, targetLang, sourceLang),
    translateArray(originalData.servicios_excluidos, targetLang, sourceLang),
    translateArray(originalData.que_llevar, targetLang, sourceLang)
  ]);

  const translatedData = {
    nombre: translatedNombre,
    descripcion: translatedDescripcion,
    itinerario: translatedItinerario,
    servicios_incluidos: translatedIncluidos,
    servicios_excluidos: translatedExcluidos,
    que_llevar: translatedQueLlevar,
  };

  return {
    [sourceLang]: originalData,
    [targetLang]: translatedData,
  };
}

/**
 * Genera el objeto bilingüe { es: {...}, en: {...} } para una Attraction (Punto GIS).
 */
export async function generateBilingualAttraction(attractionInput) {
  const sampleText = `${attractionInput.name || ''} ${attractionInput.description || ''}`;
  const sourceLang = detectLanguage(sampleText);
  const targetLang = sourceLang === 'es' ? 'en' : 'es';

  const originalData = {
    name: attractionInput.name || '',
    description: attractionInput.description || '',
  };

  const [translatedName, translatedDescription] = await Promise.all([
    translateWithPreservation(originalData.name, targetLang, sourceLang),
    translateWithPreservation(originalData.description, targetLang, sourceLang)
  ]);

  const translatedData = {
    name: translatedName,
    description: translatedDescription,
  };

  return {
    [sourceLang]: originalData,
    [targetLang]: translatedData,
  };
}
