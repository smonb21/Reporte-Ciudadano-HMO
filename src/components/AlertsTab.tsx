import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Volume2,
  VolumeX,
  ExternalLink,
  Loader2,
  ImageOff,
} from 'lucide-react';
import type { AlertsSummary, CiudadanoReport } from '../types';
import { speakSpanish, stopSpeaking } from '../utils/speech';

interface AlertsTabProps {
  reports: CiudadanoReport[];
  customApiKey: string;
}

export function AlertsTab({ reports, customApiKey }: AlertsTabProps) {
  const [summary, setSummary] = useState<AlertsSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSpeakingTips, setIsSpeakingTips] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (customApiKey.trim()) {
          headers['x-custom-gemini-key'] = customApiKey.trim();
        }

        const response = await fetch('/api/summarize-alerts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            alerts: reports.map((r) => ({
              resumen_problema: r.resumen_problema,
              colonia: r.colonia,
              ubicacion_texto: r.ubicacion_texto,
              nivel_riesgo: r.nivel_riesgo,
              accesibilidad_espacio: r.accesibilidad_espacio,
              alerta_preventiva: r.alerta_preventiva,
            })),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (!cancelled && data.summary) {
            setSummary(data.summary as AlertsSummary);
          }
        }
      } catch {
        if (!cancelled) {
          setSummary({
            resumen_general:
              'Revise estos puntos reportados por sus vecinos antes de salir a caminar por su colonia:',
            recomendaciones: reports
              .slice(0, 4)
              .map((r) => `${r.ubicacion_texto}: ${r.alerta_preventiva}`),
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [reports, customApiKey]);

  const handleSpeakSummary = () => {
    if (!summary) return;
    if (isSpeakingTips) {
      stopSpeaking();
      setIsSpeakingTips(false);
      return;
    }

    const fullText = `Consejos de Movilidad Segura en tu Zona. ${summary.resumen_general}. ${summary.recomendaciones.join('. ')}`;
    speakSpanish(fullText, {
      onStart: () => setIsSpeakingTips(true),
      onEnd: () => setIsSpeakingTips(false),
    });
  };

  return (
    <section aria-labelledby="alerts-heading" className="space-y-6">
      {/* Cuadro destacado: Consejos de Movilidad Segura en tu Zona */}
      <div className="rounded-2xl border-2 border-[#C2410C] bg-[#FFF7ED] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-8 w-8 shrink-0 text-[#C2410C]" aria-hidden="true" />
          <h2 id="alerts-heading" className="text-[22px] font-extrabold leading-snug text-[#111827]">
            Consejos de Movilidad Segura en tu Zona
          </h2>
        </div>

        {isLoadingSummary ? (
          <div className="mt-4 flex items-center gap-3 text-[18px] font-bold text-[#374151]">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <span>Preparando recomendaciones para su recorrido...</span>
          </div>
        ) : summary ? (
          <div className="mt-4 space-y-4">
            <p className="text-[18px] font-bold leading-relaxed text-[#111827]">
              {summary.resumen_general}
            </p>
            <ul className="space-y-2.5 text-[18px] leading-relaxed text-[#111827]">
              {summary.recomendaciones.map((tip, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#C2410C]" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleSpeakSummary}
              className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-xl bg-[#0F2C59] px-5 py-3 text-[22px] font-bold text-white hover:bg-[#0A1F40] active:scale-[0.99]"
            >
              {isSpeakingTips ? (
                <>
                  <VolumeX className="h-7 w-7 shrink-0" aria-hidden="true" />
                  <span>Detener consejos</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-7 w-7 shrink-0" aria-hidden="true" />
                  <span>Escuchar consejos</span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Lista de Reportes Comunitarios */}
      <div className="space-y-4">
        <h3 className="text-[22px] font-extrabold text-[#111827]">
          Reportes Vecinales Activos ({reports.length})
        </h3>

        <div className="space-y-5">
          {reports.map((report) => {
            const isBroken = brokenImages[report.id] || !report.fotoDataUrl;
            const mapsUrl = `https://www.google.com/maps?q=${report.lat},${report.lng}`;

            return (
              <article
                key={report.id}
                className="overflow-hidden rounded-2xl border-2 border-[#D6D3CD] bg-white shadow-sm"
              >
                {!isBroken && report.fotoDataUrl ? (
                  <img
                    src={report.fotoDataUrl}
                    alt={`Fotografía del reporte: ${report.resumen_problema}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({
                        ...prev,
                        [report.id]: true,
                      }))
                    }
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 bg-[#EFECE6] px-4 text-center text-[#374151]">
                    <ImageOff className="h-10 w-10" aria-hidden="true" />
                    <span className="text-[18px] font-bold">Reporte ciudadano sin fotografía adjunta</span>
                  </div>
                )}

                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[18px] font-bold">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        report.accesibilidad_espacio === 'Peligroso'
                          ? 'text-[#B91C1C]'
                          : report.accesibilidad_espacio === 'Con obstáculos'
                            ? 'text-[#C2410C]'
                            : 'text-[#166534]'
                      }`}
                    >
                      {report.accesibilidad_espacio === 'Accesible' ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                      )}
                      <span>{report.accesibilidad_espacio}</span>
                    </span>

                    <span aria-hidden="true" className="text-[#6B7280]">
                      ·
                    </span>
                    <span className="text-[#374151]">{report.dependencia}</span>
                  </div>

                  <h4 className="text-[22px] font-extrabold leading-snug text-[#111827]">
                    {report.resumen_problema}
                  </h4>

                  <p className="flex items-start gap-2 text-[18px] font-bold text-[#374151]">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#0F2C59]" aria-hidden="true" />
                    <span>{report.ubicacion_texto}</span>
                  </p>

                  <p className="text-[18px] leading-relaxed text-[#111827]">
                    {report.alerta_preventiva}
                  </p>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[#0F2C59] bg-[#EEF2F8] px-4 py-3 text-[22px] font-bold text-[#0F2C59] hover:bg-[#DCE6F5]"
                  >
                    <ExternalLink className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span>Ver ubicación en Google Maps</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
