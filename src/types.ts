export type DependenciaHMO =
  | 'CIDUE / Obras Públicas'
  | 'Agua de Hermosillo'
  | 'Alumbrado Público'
  | 'Servicios Públicos'
  | 'Protección Civil';

export type NivelRiesgo = 'Alto' | 'Medio' | 'Bajo';

export type AccesibilidadEspacio = 'Accesible' | 'Con obstáculos' | 'Peligroso';

export interface GeminiAnalysisResult {
  dependencia: DependenciaHMO;
  nivel_riesgo: NivelRiesgo;
  accesibilidad_espacio: AccesibilidadEspacio;
  resumen_problema: string;
  oficio_formal: string;
  mensaje_ciudadano: string;
  alerta_preventiva: string;
}

export interface CiudadanoReport extends GeminiAnalysisResult {
  id: string;
  folio: string;
  fecha: string;
  colonia: string;
  ubicacion_texto: string;
  lat: number;
  lng: number;
  fotoDataUrl?: string;
  detalles_usuario?: string;
  estado: string;
  esPropio: boolean;
}

export interface AlertsSummary {
  resumen_general: string;
  recomendaciones: string[];
}
