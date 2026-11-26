import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DependenciaHMO =
  | 'CIDUE / Obras Públicas'
  | 'Agua de Hermosillo'
  | 'Alumbrado Público'
  | 'Servicios Públicos'
  | 'Protección Civil';

type NivelRiesgo = 'Alto' | 'Medio' | 'Bajo';
type AccesibilidadEspacio = 'Accesible' | 'Con obstáculos' | 'Peligroso';

interface AnalysisOutput {
  dependencia: DependenciaHMO;
  nivel_riesgo: NivelRiesgo;
  accesibilidad_espacio: AccesibilidadEspacio;
  resumen_problema: string;
  oficio_formal: string;
  mensaje_ciudadano: string;
  alerta_preventiva: string;
}

interface SummaryOutput {
  resumen_general: string;
  recomendaciones: string[];
}

function buildFallbackAnalysis(params: {
  description?: string;
  hasImage?: boolean;
  hasAudio?: boolean;
  lat: number;
  lng: number;
  ubicacionTexto?: string;
}): AnalysisOutput {
  const text = (params.description || '').toLowerCase();
  const coordsText = `${params.lat.toFixed(6)}, ${params.lng.toFixed(6)}`;
  const ubicacionLinea = params.ubicacionTexto?.trim()
    ? `${params.ubicacionTexto.trim()} (GPS: ${coordsText})`
    : `Hermosillo, Sonora (GPS: ${coordsText})`;
  const fechaTexto = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let dependencia: DependenciaHMO = 'CIDUE / Obras Públicas';
  let nivel_riesgo: NivelRiesgo = 'Medio';
  let accesibilidad_espacio: AccesibilidadEspacio = 'Con obstáculos';
  let resumen_problema = 'Falla en banqueta o vía peatonal que dificulta el paso';
  let alerta_preventiva =
    'Camine con precaución en este tramo y utilice la acera opuesta si usa bastón, andadera o silla de ruedas.';

  if (/agua|fuga|tubo|alcantarilla|drenaje|charco|lodo|registro/.test(text)) {
    dependencia = 'Agua de Hermosillo';
    nivel_riesgo = 'Medio';
    accesibilidad_espacio = 'Con obstáculos';
    resumen_problema = 'Fuga de agua o registro dañado en la vía pública';
    alerta_preventiva =
      'Evite pisar el agua acumulada para prevenir resbalones; rodee por la zona seca de la banqueta.';
  } else if (/luz|poste|lámpara|lampara|oscuro|alumbrado|foco|apagado/.test(text)) {
    dependencia = 'Alumbrado Público';
    nivel_riesgo = 'Alto';
    accesibilidad_espacio = 'Peligroso';
    resumen_problema = 'Falla de alumbrado público o poste en mal estado';
    alerta_preventiva =
      'Si camina al caer la tarde, evite esta cuadra poco iluminada o lleve una linterna para ver desniveles.';
  } else if (/basura|rama|árbol|arbol|maleza|parque|escombro|llanta/.test(text)) {
    dependencia = 'Servicios Públicos';
    nivel_riesgo = 'Bajo';
    accesibilidad_espacio = 'Con obstáculos';
    resumen_problema = 'Acumulación de basura, escombro o maleza en banqueta';
    alerta_preventiva =
      'Cuidado con obstáculos sobre la acera; verifique su paso antes de cruzar este tramo.';
  } else if (/cable|caído|caido|derrumbe|socavón|socavon|peligro|incendio|gas|hueco/.test(text)) {
    dependencia = 'Protección Civil';
    nivel_riesgo = 'Alto';
    accesibilidad_espacio = 'Peligroso';
    resumen_problema = 'Riesgo urbano que requiere atención inmediata de seguridad';
    alerta_preventiva =
      'Aléjese de esta esquina y no intente cruzar por la zona dañada; avise a sus vecinos.';
  } else if (params.hasImage || params.hasAudio || text.length > 0) {
    dependencia = 'CIDUE / Obras Públicas';
    nivel_riesgo = 'Alto';
    accesibilidad_espacio = 'Peligroso';
    resumen_problema = 'Banqueta o cruce peatonal dañado en Hermosillo';
    alerta_preventiva =
      'Tenga cuidado con desniveles en el pavimento y busque una rampa libre en la esquina anterior.';
  }

  const detalleCiudadano = params.description?.trim()
    ? `Descripción proporcionada: "${params.description.trim()}".`
    : params.hasAudio
      ? 'El ciudadano adjuntó nota de voz describiendo el problema en sitio.'
      : 'El ciudadano adjuntó fotografía de evidencia capturada en sitio.';

  const oficio_formal = [
    'H. AYUNTAMIENTO DE HERMOSILLO, SONORA',
    `A LA ATENCIÓN DE: ${dependencia.toUpperCase()}`,
    `Fecha: ${fechaTexto}`,
    `Ubicación reportada: ${ubicacionLinea}`,
    '',
    `Asunto: Solicitud ciudadana de atención a falla de infraestructura urbana (${resumen_problema}).`,
    '',
    'Por medio de la presente, se hace del conocimiento de esa honorable dependencia una incidencia detectada en la vía pública de Hermosillo, Sonora, la cual afecta la seguridad y movilidad peatonal, especialmente de personas adultas mayores, con debilidad visual o movilidad reducida.',
    '',
    detalleCiudadano,
    `Valoración preliminar de riesgo: ${nivel_riesgo}. Condición de accesibilidad del espacio: ${accesibilidad_espacio}.`,
    '',
    'Se solicita atentamente su pronta inspección técnica, señalización preventiva y reparación correspondiente.',
    'Atentamente,',
    'Reporte Ciudadano HMO',
  ].join('\n');

  const mensaje_ciudadano = `¡Gracias por cuidarnos! Recibimos su reporte en ${params.ubicacionTexto?.trim() || 'Hermosillo'} sobre ${resumen_problema.toLowerCase()}. Lo enviamos para gestión ante ${dependencia} con prioridad de riesgo ${nivel_riesgo.toLowerCase()}.`;

  return {
    dependencia,
    nivel_riesgo,
    accesibilidad_espacio,
    resumen_problema,
    oficio_formal,
    mensaje_ciudadano,
    alerta_preventiva,
  };
}

interface HermosilloZone {
  colonia: string;
  referencia: string;
  cp: string;
  lat: number;
  lng: number;
}

const HERMOSILLO_ZONES: HermosilloZone[] = [
  { colonia: 'Col. Centro', referencia: 'Zona Centro / Rosales y Serdán', cp: '83000', lat: 29.0753, lng: -110.9589 },
  { colonia: 'Col. Villa de Seris', referencia: 'Zona Villa de Seris', cp: '83280', lat: 29.0645, lng: -110.9522 },
  { colonia: 'Col. Centenario', referencia: 'Zona Centenario / Blvd. Hidalgo', cp: '83260', lat: 29.0764, lng: -110.9673 },
  { colonia: 'Col. Pitic', referencia: 'Zona Pitic / Blvd. Kino', cp: '83150', lat: 29.0928, lng: -110.9371 },
  { colonia: 'Col. San Benito', referencia: 'Zona San Benito / Blvd. Navarrete', cp: '83190', lat: 29.0856, lng: -110.9642 },
  { colonia: 'Col. Balderrama', referencia: 'Zona Balderrama / Solidaridad', cp: '83180', lat: 29.0941, lng: -110.9854 },
  { colonia: 'Col. Modelo', referencia: 'Zona Modelo / Blvd. Rodríguez', cp: '83190', lat: 29.0844, lng: -110.9518 },
  { colonia: 'Col. Las Quintas', referencia: 'Zona Las Quintas / Paseo Río Sonora', cp: '83240', lat: 29.0792, lng: -110.9921 },
  { colonia: 'Proyecto Río Sonora', referencia: 'Zona Proyecto Río Sonora / Vado del Río', cp: '83270', lat: 29.0682, lng: -110.9685 },
  { colonia: 'Col. El Sahuaro', referencia: 'Zona Sahuaro / Blvd. Lázaro Cárdenas', cp: '83170', lat: 29.1051, lng: -111.0012 },
  { colonia: 'Col. Nuevo Hermosillo', referencia: 'Zona Nuevo Hermosillo', cp: '83296', lat: 29.0352, lng: -110.9225 },
];

function resolveFallbackHermosilloAddress(lat: number, lng: number) {
  let closest = HERMOSILLO_ZONES[0];
  let bestDist = Infinity;

  for (const z of HERMOSILLO_ZONES) {
    const dLat = lat - z.lat;
    const dLng = lng - z.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      closest = z;
    }
  }

  // If user is far outside Hermosillo (> ~25 km), show generic coordinate label
  if (bestDist > 0.06) {
    return {
      calle: '',
      colonia: 'Zona urbana',
      cp: '',
      ciudad: 'Hermosillo',
      estado: 'Sonora',
      ubicacion_detallada: `Ubicación GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    };
  }

  return {
    calle: closest.referencia,
    colonia: closest.colonia,
    cp: closest.cp,
    ciudad: 'Hermosillo',
    estado: 'Sonora',
    ubicacion_detallada: `${closest.referencia}, ${closest.colonia}, C.P. ${closest.cp}, Hermosillo, Sonora`,
  };
}

function buildFallbackSummary(
  alerts: Array<{
    resumen_problema: string;
    ubicacion_texto: string;
    alerta_preventiva: string;
    nivel_riesgo: string;
  }>,
): SummaryOutput {
  if (!alerts.length) {
    return {
      resumen_general:
        'No hay alertas activas registradas en su zona en este momento. Puede caminar con tranquilidad y reportar cualquier obstáculo.',
      recomendaciones: [
        'Utilice cruces peatonales con rampa y buena iluminación.',
        'Si encuentra una banqueta rota o fuga de agua, tome una foto desde la pestaña Hacer Reporte.',
      ],
    };
  }

  const highRiskCount = alerts.filter((a) => a.nivel_riesgo === 'Alto').length;
  const topRecommendations = alerts.slice(0, 4).map((a) => {
    const place = a.ubicacion_texto || 'su zona';
    return `${place}: ${a.alerta_preventiva}`;
  });

  return {
    resumen_general: `Hay ${alerts.length} ${alerts.length === 1 ? 'reporte vecinal activo' : 'reportes vecinales activos'} en Hermosillo (${highRiskCount} de riesgo alto). Revise estas recomendaciones antes de salir a caminar:`,
    recomendaciones: topRecommendations,
  };
}

function createGenAIClient(customKey?: string): GoogleGenAI | null {
  const apiKey = (customKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithActiveModels(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    config: Record<string, unknown>;
  },
) {
  const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents as never,
          config: params.config as never,
        });
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : '';
        const isTransient = /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(message);
        if (isTransient && attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('Gemini unavailable');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      hasServerKey: Boolean((process.env.GEMINI_API_KEY || '').trim()),
    });
  });

  app.get('/api/reverse-geocode', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.json({
        ok: true,
        source: 'fallback',
        address: resolveFallbackHermosilloAddress(29.072967, -110.955919),
      });
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat,
      )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=es`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ReporteCiudadanoHMO/1.0 (Hermosillo Accessibility App)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4500),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        address?: Record<string, string | undefined>;
        display_name?: string;
      };

      const addr = data.address || {};
      const road = addr.road || addr.pedestrian || addr.footway || addr.path || '';
      const houseNumber = addr.house_number || '';
      const calle = [road, houseNumber].filter(Boolean).join(' ').trim();
      const rawColonia =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.residential ||
        addr.city_district ||
        '';
      const colonia = rawColonia
        ? rawColonia.toLowerCase().startsWith('col')
          ? rawColonia
          : `Col. ${rawColonia}`
        : '';
      const cp = addr.postcode || '';
      const ciudad = addr.city || addr.town || addr.municipality || 'Hermosillo';
      const estado = addr.state || 'Sonora';

      const parts = [
        calle,
        colonia,
        cp ? `C.P. ${cp}` : '',
        ciudad,
        estado,
      ].filter(Boolean);

      const ubicacion_detallada =
        parts.length > 0
          ? parts.join(', ')
          : data.display_name || resolveFallbackHermosilloAddress(lat, lng).ubicacion_detallada;

      return res.json({
        ok: true,
        source: 'nominatim',
        address: {
          calle,
          colonia: colonia || 'Hermosillo',
          cp,
          ciudad,
          estado,
          ubicacion_detallada,
        },
      });
    } catch {
      return res.json({
        ok: true,
        source: 'fallback',
        address: resolveFallbackHermosilloAddress(lat, lng),
      });
    }
  });

  app.post('/api/analyze-report', async (req, res) => {
    const body = req.body || {};
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
    const rawImageMime =
      typeof body.imageMimeType === 'string' ? body.imageMimeType.trim() : '';
    const imageMimeType = /^image\/(jpeg|jpg|png|webp|gif|heic|heif)$/i.test(rawImageMime)
      ? rawImageMime
      : 'image/jpeg';
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
    const rawAudioMime =
      typeof body.audioMimeType === 'string' ? body.audioMimeType.trim() : '';
    const audioMimeType = /^audio\/(webm|mp4|mpeg|ogg|wav|aac|m4a)/i.test(rawAudioMime)
      ? rawAudioMime.split(';')[0]
      : 'audio/webm';
    const description =
      typeof body.description === 'string' ? body.description.slice(0, 4000) : '';
    const rawLat = typeof body.lat === 'number' ? body.lat : 29.072967;
    const rawLng = typeof body.lng === 'number' ? body.lng : -110.955919;
    const lat = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 29.072967;
    const lng = Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : -110.955919;
    const ubicacionTexto =
      typeof body.ubicacionTexto === 'string' && body.ubicacionTexto.trim()
        ? body.ubicacionTexto.trim().slice(0, 300)
        : `Hermosillo, Sonora (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

    const customKey = req.header('x-custom-gemini-key');
    const ai = createGenAIClient(customKey);

    if (!ai) {
      return res.json({
        ok: true,
        source: 'fallback',
        reason: 'missing_key',
        report: buildFallbackAnalysis({
          description,
          hasImage: Boolean(imageBase64),
          hasAudio: Boolean(audioBase64),
          lat,
          lng,
          ubicacionTexto,
        }),
      });
    }

    try {
      const parts: Array<Record<string, unknown>> = [];

      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
          },
        });
      }

      if (audioBase64) {
        parts.push({
          inlineData: {
            mimeType: audioMimeType,
            data: audioBase64,
          },
        });
      }

      const promptText = [
        'Eres un asistente municipal empático y experto en accesibilidad urbana de Hermosillo, Sonora, México.',
        'Analiza la evidencia proporcionada por un adulto mayor o persona con debilidad visual o movilidad reducida (foto, audio y/o texto) junto con la ubicación GPS.',
        `Ubicación detectada: ${ubicacionTexto} (latitud ${lat}, longitud ${lng}).`,
        description.trim()
          ? `Texto escrito por el ciudadano: "${description.trim()}"`
          : 'El ciudadano no escribió texto adicional; apóyate en la foto y/o el audio.',
        'Clasifica exactamente la dependencia municipal de Hermosillo correspondiente entre:',
        '- CIDUE / Obras Públicas',
        '- Agua de Hermosillo',
        '- Alumbrado Público',
        '- Servicios Públicos',
        '- Protección Civil',
        'Redacta el mensaje_ciudadano en Lectura Fácil (cálido, claro, sin tecnicismos) y un oficio_formal bien estructurado listo para presentar ante el Ayuntamiento de Hermosillo.',
      ].join('\n');

      parts.push({ text: promptText });

      const response = await generateWithActiveModels(ai, {
        contents: { parts },
        config: {
          systemInstruction:
            'Responde siempre en español de México (es-MX) con claridad, respeto y enfoque en accesibilidad peatonal para Hermosillo, Sonora.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dependencia: {
                type: Type.STRING,
                enum: [
                  'CIDUE / Obras Públicas',
                  'Agua de Hermosillo',
                  'Alumbrado Público',
                  'Servicios Públicos',
                  'Protección Civil',
                ],
                description: 'Dependencia municipal de Hermosillo que debe atender el caso.',
              },
              nivel_riesgo: {
                type: Type.STRING,
                enum: ['Alto', 'Medio', 'Bajo'],
                description: 'Nivel de riesgo para peatones y personas con movilidad reducida.',
              },
              accesibilidad_espacio: {
                type: Type.STRING,
                enum: ['Accesible', 'Con obstáculos', 'Peligroso'],
                description: 'Condición actual de accesibilidad en el sitio.',
              },
              resumen_problema: {
                type: Type.STRING,
                description: 'Título corto y claro del problema detectado (máximo 10 palabras).',
              },
              oficio_formal: {
                type: Type.STRING,
                description:
                  'Oficio formal completo dirigido a la dependencia correspondiente del Ayuntamiento de Hermosillo.',
              },
              mensaje_ciudadano: {
                type: Type.STRING,
                description:
                  'Confirmación cálida, empática y en Lectura Fácil explicando qué se detectó y qué dependencia lo atiende.',
              },
              alerta_preventiva: {
                type: Type.STRING,
                description: 'Consejo breve y práctico de movilidad segura para otros vecinos.',
              },
            },
            required: [
              'dependencia',
              'nivel_riesgo',
              'accesibilidad_espacio',
              'resumen_problema',
              'oficio_formal',
              'mensaje_ciudadano',
              'alerta_preventiva',
            ],
          },
        },
      });

      const rawText = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(rawText) as AnalysisOutput;

      if (!parsed.dependencia || !parsed.oficio_formal || !parsed.mensaje_ciudadano) {
        throw new Error('Respuesta incompleta');
      }

      return res.json({
        ok: true,
        source: 'gemini',
        report: parsed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.warn('Gemini analyze-report fallback:', msg);
      return res.json({
        ok: true,
        source: 'fallback',
        report: buildFallbackAnalysis({
          description,
          hasImage: Boolean(imageBase64),
          hasAudio: Boolean(audioBase64),
          lat,
          lng,
          ubicacionTexto,
        }),
      });
    }
  });

  app.post('/api/summarize-alerts', async (req, res) => {
    const alerts = Array.isArray(req.body?.alerts) ? req.body.alerts : [];
    const customKey = req.header('x-custom-gemini-key');
    const ai = createGenAIClient(customKey);

    if (!ai || alerts.length === 0) {
      return res.json({
        ok: true,
        source: 'fallback',
        summary: buildFallbackSummary(alerts),
      });
    }

    try {
      const compactAlerts = alerts.slice(0, 8).map((a: Record<string, unknown>) => ({
        problema: a.resumen_problema,
        ubicacion: a.ubicacion_texto || a.colonia,
        riesgo: a.nivel_riesgo,
        accesibilidad: a.accesibilidad_espacio,
        consejo: a.alerta_preventiva,
      }));

      const response = await generateWithActiveModels(ai, {
        contents: [
          'Resume estos reportes vecinales activos en Hermosillo, Sonora, en consejos prácticos de movilidad segura para adultos mayores y personas con debilidad visual o movilidad reducida.',
          'Ejemplo de tono deseado: "Evite transitar por Rosales y Serdán: se reportó banqueta bloqueada y sin rampa".',
          JSON.stringify(compactAlerts),
        ].join('\n\n'),
        config: {
          systemInstruction:
            'Usa lenguaje muy claro, directo, empático y fácil de escuchar en voz alta (Lectura Fácil en español de México).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumen_general: {
                type: Type.STRING,
                description: 'Párrafo breve (máximo 2 oraciones) con la situación general de la zona.',
              },
              recomendaciones: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 2 a 4 consejos concretos mencionando calles o colonias.',
              },
            },
            required: ['resumen_general', 'recomendaciones'],
          },
        },
      });

      const rawText = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(rawText) as SummaryOutput;
      if (!parsed.resumen_general || !Array.isArray(parsed.recomendaciones)) {
        throw new Error('Resumen incompleto');
      }

      return res.json({
        ok: true,
        source: 'gemini',
        summary: parsed,
      });
    } catch {
      return res.json({
        ok: true,
        source: 'fallback',
        summary: buildFallbackSummary(alerts),
      });
    }
  });

  app.get('/reporteciudadanohmo_paquete_servidor.zip', (_req, res) => {
    const zipPath = path.resolve(__dirname, 'reporteciudadanohmo_paquete_servidor.zip');
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ ok: false, error: 'zip_not_found' });
    }
    return res.download(zipPath, 'reporteciudadanohmo_paquete_servidor.zip');
  });

  app.get('/frontend_dist_para_ftp.zip', (_req, res) => {
    const zipPath = path.resolve(__dirname, 'frontend_dist_para_ftp.zip');
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ ok: false, error: 'zip_not_found' });
    }
    return res.download(zipPath, 'frontend_dist_para_ftp.zip');
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Reporte Ciudadano HMO escuchando en http://0.0.0.0:${port}`);
  });
}

startServer();
