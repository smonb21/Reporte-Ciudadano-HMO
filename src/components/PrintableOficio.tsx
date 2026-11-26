import { useState } from 'react';
import { X, Download, Printer, Check, Loader2 } from 'lucide-react';
import type { CiudadanoReport } from '../types';
import { downloadOficioPdf } from '../utils/oficioExport';

interface PrintableOficioProps {
  report: CiudadanoReport | null;
  onClose: () => void;
}

export function PrintableOficio({ report, onClose }: PrintableOficioProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!report) return null;

  const formattedDate = new Date(report.fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadOficioPdf(report);
      setPdfDownloaded(true);
      window.setTimeout(() => setPdfDownloaded(false), 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintDirect = () => {
    window.print();
  };

  return (
    <>
      {/* Vista previa accesible en pantalla + barra de descarga PDF / impresión */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6 print:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-oficio-title"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-[#111827] bg-white shadow-2xl">
          {/* Controles superiores */}
          <div className="sticky top-0 z-10 flex flex-col gap-3 border-b-2 border-[#D6D3CD] bg-[#FAF8F5] p-4 rounded-t-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="preview-oficio-title" className="text-[22px] font-extrabold text-[#0F2C59]">
                Respaldo Oficial del Oficio
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar vista previa"
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border-2 border-[#374151] bg-white text-[#111827] hover:bg-[#EFECE6]"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className={`flex min-h-[60px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-[22px] font-bold text-white ${
                  pdfDownloaded
                    ? 'bg-[#166534]'
                    : 'bg-[#0F2C59] hover:bg-[#0A1F40]'
                }`}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden="true" />
                    <span>Generando PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span>PDF descargado</span>
                  </>
                ) : (
                  <>
                    <Download className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrintDirect}
                className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 border-[#0F2C59] bg-white px-4 py-3 text-[22px] font-bold text-[#0F2C59] hover:bg-[#EEF2F8]"
              >
                <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span>Imprimir en papel</span>
              </button>
            </div>
          </div>

          {/* Hoja del documento */}
          <div className="p-5 sm:p-8 text-[#111827]">
            <div className="border-b-2 border-[#111827] pb-4 mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[16px] font-bold tracking-wide text-[#0F2C59]">
                  HERMOSILLO, SONORA · REPORTE CIUDADANO HMO
                </p>
                <h3 className="text-[22px] font-extrabold mt-1">
                  Oficio Formal de Atención Ciudadana
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[16px] font-bold text-[#374151]">FOLIO</p>
                <p className="tabular-nums text-[22px] font-extrabold text-[#0F2C59]">
                  {report.folio}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-2 border-[#D6D3CD] bg-[#FAF8F5] rounded-xl p-4 mb-5 text-[18px]">
              <div>
                <p>
                  <strong>Fecha:</strong> {formattedDate}
                </p>
                <p>
                  <strong>Dependencia:</strong> {report.dependencia}
                </p>
                <p>
                  <strong>Estado:</strong> {report.estado}
                </p>
              </div>
              <div>
                <p>
                  <strong>Riesgo:</strong> {report.nivel_riesgo}
                </p>
                <p>
                  <strong>Accesibilidad:</strong> {report.accesibilidad_espacio}
                </p>
                <p className="tabular-nums">
                  <strong>GPS:</strong> {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p>
                  <strong>Ubicación:</strong> {report.ubicacion_texto}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-[20px] font-bold mb-2">Cuerpo del Oficio Formal</h4>
              <div className="whitespace-pre-wrap text-[18px] leading-relaxed border border-[#D6D3CD] rounded-xl p-4 bg-white">
                {report.oficio_formal}
              </div>
            </div>

            {report.detalles_usuario && (
              <div className="mb-5 border border-[#D6D3CD] rounded-xl p-4 text-[18px] bg-[#FAF8F5]">
                <p>
                  <strong>Notas adicionales del ciudadano:</strong> {report.detalles_usuario}
                </p>
              </div>
            )}

            {report.fotoDataUrl && (
              <div className="mb-6">
                <h4 className="text-[20px] font-bold mb-2">Evidencia Fotográfica</h4>
                <img
                  src={report.fotoDataUrl}
                  alt={`Evidencia de ${report.folio}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[300px] w-auto rounded-xl border border-[#D6D3CD] object-contain"
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t-2 border-[#111827] grid grid-cols-1 sm:grid-cols-2 gap-8 text-[18px]">
              <div>
                <div className="h-12 border-b-2 border-[#111827] mb-2" />
                <p className="font-bold">Firma del Ciudadano / Solicitante</p>
              </div>
              <div>
                <div className="h-12 border-b-2 border-[#111827] mb-2" />
                <p className="font-bold">Sello y Fecha de Recibido (Ayuntamiento)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copia limpia exclusiva para impresión física (@media print) */}
      <div className="hidden print:block bg-white text-black p-6 max-w-3xl mx-auto">
        <div className="border-b-2 border-black pb-4 mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold tracking-wide">
              HERMOSILLO, SONORA · REPORTE CIUDADANO HMO
            </p>
            <h1 className="text-[22px] font-extrabold mt-1">
              Oficio Formal de Atención Ciudadana
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold">FOLIO</p>
            <p className="tabular-nums text-[18px] font-extrabold">{report.folio}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border border-black p-3 mb-5 text-[14px]">
          <div>
            <p>
              <strong>Fecha:</strong> {formattedDate}
            </p>
            <p>
              <strong>Dependencia:</strong> {report.dependencia}
            </p>
            <p>
              <strong>Estado:</strong> {report.estado}
            </p>
          </div>
          <div>
            <p>
              <strong>Riesgo:</strong> {report.nivel_riesgo}
            </p>
            <p>
              <strong>Accesibilidad:</strong> {report.accesibilidad_espacio}
            </p>
            <p className="tabular-nums">
              <strong>GPS:</strong> {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
            </p>
          </div>
          <div className="col-span-2">
            <p>
              <strong>Ubicación:</strong> {report.ubicacion_texto}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-[16px] font-bold mb-2">Cuerpo del Oficio Formal</h2>
          <div className="whitespace-pre-wrap text-[14px] leading-relaxed border border-black/40 p-4">
            {report.oficio_formal}
          </div>
        </div>

        {report.detalles_usuario && (
          <div className="mb-5 border border-black/40 p-3 text-[14px]">
            <p>
              <strong>Notas adicionales del ciudadano:</strong> {report.detalles_usuario}
            </p>
          </div>
        )}

        {report.fotoDataUrl && (
          <div className="mb-6">
            <h2 className="text-[16px] font-bold mb-2">Evidencia Fotográfica</h2>
            <img
              src={report.fotoDataUrl}
              alt={`Evidencia de ${report.folio}`}
              className="max-h-[260px] w-auto border border-black/40 object-contain"
            />
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-black grid grid-cols-2 gap-8 text-[13px]">
          <div>
            <div className="h-12 border-b border-black mb-1" />
            <p className="font-bold">Firma del Ciudadano / Solicitante</p>
          </div>
          <div>
            <div className="h-12 border-b border-black mb-1" />
            <p className="font-bold">Sello y Fecha de Recibido (Ayuntamiento)</p>
          </div>
        </div>
      </div>
    </>
  );
}
