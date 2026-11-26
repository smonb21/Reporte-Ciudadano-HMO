# Reporte Ciudadano HMO

**Equipo:** Reporte Ciudadano HMO | **Campus:** Hermosillo  
**Integrantes:** Sebastian Monroy Bojórquez, Jesús René Carranza López, Moisés Anthony Zamudio Salinas  
**Demo (Video / Evidencias):** [Ver en Google Drive](https://drive.google.com/file/d/1Hq0tmJyiQgae-F9P1J3B_5E8qtWA6tti/view?usp=sharing) | **Aplicación (Pagina web):** [Abrir Reporte Ciudadano HMO](https://clubdecienciafronteriza.com/reporteciudadanohmo/)

---

## 1. Resumen ejecutivo

**Reporte Ciudadano HMO** es una aplicación web móvil (PWA) diseñada para que adultos mayores y personas con debilidad visual, movilidad reducida o baja alfabetización digital en Hermosillo, Sonora, reporten fallas de infraestructura urbana sin llenar formularios complejos. Su innovación radica en el uso multimodal de **Google Gemini (`gemini-2.5-flash`)**: el usuario solo toma una foto y graba una nota de voz natural mientras la app captura su ubicación GPS. La IA evalúa el riesgo, identifica la dependencia municipal responsable, genera un oficio formal en PDF, responde con lectura en voz alta y crea alertas vecinales preventivas.

---

## 2. Boceto y concepto

### El problema
Las zonas urbanas de Hermosillo presentan fallas de infraestructura —como banquetas destruidas, rampas bloqueadas, alcantarillas abiertas, luminarias apagadas o fugas de agua— que representan riesgos directos de accidentes y exclusión para adultos mayores y personas con discapacidad.

Aunque existen canales de atención ciudadana, los métodos actuales exigen llenar formularios digitales extensos y redactar descripciones técnicas por escrito. Esto genera una barrera de acceso que excluye precisamente a la población más afectada: personas con debilidad visual, movilidad reducida o brecha digital.

### Propuesta de solución
**Reporte Ciudadano HMO** elimina los formularios tradicionales mediante una experiencia móvil guiada por voz e imagen, dividida en tres pestañas simples (**Hacer Reporte**, **Alertas Vecinales** y **Mis Reportes**). El ciudadano reporta un problema tal como lo contaría a un vecino —con una foto y un audio breve— y la aplicación se encarga automáticamente de obtener la ubicación, evaluar el riesgo de accesibilidad, canalizar el caso a la autoridad municipal correspondiente y generar un oficio formal en PDF listo para seguimiento, además de alertar a la comunidad sobre peligros cercanos.

### Alineación con los Objetivos de Desarrollo Sostenible (ODS)
* **ODS 10 — Reducción de las desigualdades:** Promueve la inclusión digital y cívica de adultos mayores y personas con discapacidad o baja alfabetización digital, garantizando que puedan ejercer su derecho a reportar problemas urbanos en igualdad de condiciones.
* **ODS 11 — Ciudades y comunidades sostenibles:** Contribuye a hacer de Hermosillo una ciudad más inclusiva y segura al visibilizar riesgos de accesibilidad urbana, facilitar su atención oportuna por las dependencias municipales y prevenir accidentes mediante alertas comunitarias.

---

## 3. Documentación funcional

| Función | Descripción |
| :--- | :--- |
| **1. Captura fotográfica con evaluación de accesibilidad** | Permite tomar una fotografía del desperfecto urbano para que el sistema analice visualmente el entorno y determine el nivel de riesgo y afectación a la accesibilidad. |
| **2. Reporte por nota de voz y GPS automático** | Sustituye los formularios escritos por la grabación de una nota de voz en lenguaje natural (con opción de texto alternativo), capturando automáticamente las coordenadas GPS del lugar del incidente. |
| **3. Clasificación inteligente y oficio formal en PDF** | Identifica la dependencia municipal responsable (*CIDUE, Alumbrado Público, Agua de Hermosillo, Servicios Públicos o Protección Civil*) y genera automáticamente un oficio formal estructurado en PDF con folio, ubicación y evidencia fotográfica. |
| **4. Confirmación empática con lectura en voz alta** | Devuelve al ciudadano una respuesta clara, breve y empática confirmando su reporte, con opción de reproducción en voz alta para usuarios con debilidad visual o dificultades de lectura. |
| **5. Alertas vecinales e historial personal** | Incluye un apartado comunitario con recomendaciones prácticas de movilidad segura y una pestaña de **Mis Reportes** para consultar, escuchar, editar o descargar los reportes enviados. |

---

## 4. Documentación técnica

### Arquitectura general
La aplicación sigue una arquitectura **PWA (Progressive Web App) con enfoque Mobile-First** orientada al navegador móvil. Las APIs nativas del navegador capturan los datos multimedia y geográficos directamente desde el dispositivo del usuario y los envían a la **Google Gemini API** para su procesamiento multimodal.

```text
[Dispositivo Móvil (PWA - React)]
   ├── Cámara (HTML5) ─────────► Fotografía del entorno
   ├── MediaRecorder API ──────► Nota de voz del ciudadano
   └── Geolocation API ────────► Coordenadas GPS automáticas
                 │
                 ▼
  [Google Gemini API (gemini-2.5-flash)]
   • Evaluación multimodal de riesgo y accesibilidad
   • Identificación de dependencia municipal responsable
   • Redacción de oficio formal estructurado
   • Respuesta empática en lenguaje sencillo
   • Resumen de reportes en alertas preventivas
                 │
                 ▼
[Interfaz del Usuario (React + Web Speech API)]
   ├── Confirmación empática leída en voz alta
   ├── Descarga de oficio formal en PDF con evidencia
   ├── Historial personal editable ("Mis Reportes")
   └── Tablero comunitario ("Alertas Vecinales")
