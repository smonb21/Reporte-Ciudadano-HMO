import type { CiudadanoReport } from '../types';

export const SEED_COMMUNITY_REPORTS: CiudadanoReport[] = [
  {
    id: 'seed-hmo-1',
    folio: 'HMO-2026-1042',
    fecha: '2026-11-26T08:15:00.000Z',
    colonia: 'Colonia Centro',
    ubicacion_texto: 'Calle Rosales y Av. Serdán, Col. Centro',
    lat: 29.0753,
    lng: -110.9589,
    fotoDataUrl: '/src/assets/images/hmo_banqueta_bloqueada_1795718285968.jpg',
    dependencia: 'CIDUE / Obras Públicas',
    nivel_riesgo: 'Alto',
    accesibilidad_espacio: 'Peligroso',
    resumen_problema: 'Banqueta fracturada y rampa peatonal obstruida',
    oficio_formal:
      'H. AYUNTAMIENTO DE HERMOSILLO\nCOORDINACIÓN DE INFRAESTRUCTURA, DESARROLLO URBANO Y ECOLOGÍA (CIDUE)\n\nAsunto: Solicitud urgente de reparación de banqueta y liberación de rampa peatonal.\nUbicación: Calle Rosales y Av. Serdán, Colonia Centro, Hermosillo, Sonora (29.0753, -110.9589).\n\nPor medio del presente se reporta fractura grave de concreto en banqueta y obstrucción total de la rampa para personas con movilidad reducida, representando riesgo de caídas para adultos mayores y peatones con debilidad visual.',
    mensaje_ciudadano:
      'Se detectó banqueta rota y rampa bloqueada en Rosales y Serdán. CIDUE / Obras Públicas ya tiene el reporte para reparar el paso peatonal.',
    alerta_preventiva:
      'Evite transitar por Rosales y Serdán: se reportó banqueta bloqueada y sin rampa segura. Use la acera opuesta.',
    estado: 'Enviado / Listo para gestión',
    esPropio: false,
  },
  {
    id: 'seed-hmo-2',
    folio: 'HMO-2026-1038',
    fecha: '2026-11-25T16:40:00.000Z',
    colonia: 'Colonia Villa de Seris',
    ubicacion_texto: 'Calle Juárez y Av. Sonora, Col. Villa de Seris',
    lat: 29.0645,
    lng: -110.9522,
    fotoDataUrl: '/src/assets/images/hmo_fuga_agua_1795718286990.jpg',
    dependencia: 'Agua de Hermosillo',
    nivel_riesgo: 'Medio',
    accesibilidad_espacio: 'Con obstáculos',
    resumen_problema: 'Fuga de agua potable en esquina y cruce peatonal',
    oficio_formal:
      'ORGANISMO OPERADOR DE AGUA DE HERMOSILLO (AGUAH)\n\nAsunto: Reporte de fuga de agua en vía pública y encharcamiento en cruce peatonal.\nUbicación: Calle Juárez y Av. Sonora, Colonia Villa de Seris, Hermosillo, Sonora (29.0645, -110.9522).\n\nSe solicita la atención de cuadrilla técnica para reparar fuga activa en toma hidráulica que genera encharcamiento y superficie resbaladiza en la zona de cruce peatonal.',
    mensaje_ciudadano:
      'Detectamos fuga de agua en la esquina de Juárez y Sonora. Agua de Hermosillo es la dependencia encargada de reparar la tubería.',
    alerta_preventiva:
      'Precaución al cruzar Juárez y Sonora por piso mojado y resbaloso; rodee por la esquina seca.',
    estado: 'Enviado / Listo para gestión',
    esPropio: false,
  },
  {
    id: 'seed-hmo-3',
    folio: 'HMO-2026-1029',
    fecha: '2026-11-25T11:20:00.000Z',
    colonia: 'Colonia Balderrama',
    ubicacion_texto: 'Blvd. Solidaridad y Calle Mendoza, Col. Balderrama',
    lat: 29.0941,
    lng: -110.9854,
    fotoDataUrl: '/src/assets/images/hmo_luminaria_danada_1795718287020.jpg',
    dependencia: 'Alumbrado Público',
    nivel_riesgo: 'Alto',
    accesibilidad_espacio: 'Peligroso',
    resumen_problema: 'Poste de luminaria inclinado y lámpara dañada',
    oficio_formal:
      'DIRECCIÓN DE ALUMBRADO PÚBLICO DE HERMOSILLO\n\nAsunto: Retiro y sustitución urgente de poste de alumbrado inclinado.\nUbicación: Blvd. Solidaridad y Calle Mendoza, Colonia Balderrama, Hermosillo, Sonora (29.0941, -110.9854).\n\nSe reporta poste metálico severamente inclinado sobre la acera con luminaria rota y riesgo eléctrico o de caída sobre peatones.',
    mensaje_ciudadano:
      'Se detectó un poste de luz inclinado y dañado sobre la banqueta. Alumbrado Público atenderá este punto para evitar accidentes.',
    alerta_preventiva:
      'No camine debajo del poste inclinado en Solidaridad y Mendoza; cruce con precaución por la acera contraria.',
    estado: 'Enviado / Listo para gestión',
    esPropio: false,
  },
];
