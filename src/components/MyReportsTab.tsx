import { useState, useEffect } from 'react';
import {
  Pencil,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Download,
  Printer,
} from 'lucide-react';
import type { CiudadanoReport } from '../types';
import { speakSpanish, stopSpeaking } from '../utils/speech';
import { downloadOficioTxt } from '../utils/oficioExport';

interface MyReportsTabProps {
  reports: CiudadanoReport[];
  onUpdateReport: (id: string, updates: Partial<CiudadanoReport>) => void;
  onDeleteReport: (id: string) => void;
  onGoToCreate: () => void;
  onPrintReport: (report: CiudadanoReport) => void;
}

export function MyReportsTab({
  reports,
  onUpdateReport,
  onDeleteReport,
  onGoToCreate,
  onPrintReport,
}: MyReportsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [expandedOficioId, setExpandedOficioId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const startEdit = (report: CiudadanoReport) => {
    setEditingId(report.id);
    setEditTitle(report.resumen_problema);
    setEditDetails(report.detalles_usuario || '');
  };

  const saveEdit = (id: string) => {
    onUpdateReport(id, {
      resumen_problema: editTitle.trim() || 'Reporte ciudadano',
      detalles_usuario: editDetails.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleListen = (report: CiudadanoReport) => {
    if (speakingId === report.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    const extra = report.detalles_usuario ? ` Detalles adicionales: ${report.detalles_usuario}.` : '';
    const text = `Folio ${report.folio}. Estado: ${report.estado}. Dependencia: ${report.dependencia}. ${report.resumen_problema}. ${report.mensaje_ciudadano}.${extra}`;

    speakSpanish(text, {
      onStart: () => setSpeakingId(report.id),
      onEnd: () => setSpeakingId(null),
    });
  };

  const handleCopyOficio = async (report: CiudadanoReport) => {
    setExpandedOficioId(report.id);
    try {
      await navigator.clipboard.writeText(report.oficio_formal);
      setCopiedId(report.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === report.id ? null : prev));
      }, 3000);
    } catch {
      setCopiedId(report.id);
    }
  };

  const handleDownloadOficio = (report: CiudadanoReport) => {
    downloadOficioTxt(report);
    setDownloadedId(report.id);
    window.setTimeout(() => {
      setDownloadedId((prev) => (prev === report.id ? null : prev));
    }, 3000);
  };

  if (reports.length === 0) {
    return (
      <section aria-labelledby="empty-reports-title" className="rounded-2xl border-2 border-[#D6D3CD] bg-white p-6 text-center space-y-5">
        <FileText className="mx-auto h-12 w-12 text-[#0F2C59]" aria-hidden="true" />
        <h2 id="empty-reports-title" className="text-[24px] font-extrabold text-[#111827]">
          Aún no tiene reportes guardados
        </h2>
        <p className="text-[18px] leading-relaxed text-[#374151]">
          Cuando envíe un reporte con foto o voz, aparecerá aquí para que pueda escucharlo, editarlo
          o copiar su oficio formal.
        </p>
        <button
          type="button"
          onClick={onGoToCreate}
          className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0F2C59] px-5 py-4 text-[22px] font-bold text-white hover:bg-[#0A1F40]"
        >
          <PlusCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
          <span>Hacer Reporte</span>
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="my-reports-heading" className="space-y-5">
      <h2 id="my-reports-heading" className="text-[24px] font-extrabold text-[#111827]">
        Mis Reportes ({reports.length})
      </h2>

      <div className="space-y-5">
        {reports.map((report) => {
          const isEditing = editingId === report.id;
          const isSpeaking = speakingId === report.id;
          const isCopied = copiedId === report.id;
          const isDownloaded = downloadedId === report.id;
          const isOficioOpen = expandedOficioId === report.id;
          const isConfirmingDelete = confirmDeleteId === report.id;

          const formattedDate = new Date(report.fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <article
              key={report.id}
              className="rounded-2xl border-2 border-[#D6D3CD] bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E5E2DC] pb-3">
                <span className="tabular-nums text-[22px] font-extrabold text-[#0F2C59]">
                  {report.folio}
                </span>
                <span className="text-[18px] font-bold text-[#374151]">{formattedDate}</span>
              </div>

              <div className="space-y-1.5 text-[18px]">
                <p className="font-bold text-[#166534]">Estado: {report.estado}</p>
                <p className="font-bold text-[#111827]">Dependencia: {report.dependencia}</p>
              </div>

              {isEditing ? (
                <div className="space-y-3 rounded-xl border-2 border-[#0F2C59] bg-[#FAF8F5] p-4">
                  <div>
                    <label
                      htmlFor={`edit-title-${report.id}`}
                      className="mb-1.5 block text-[18px] font-bold text-[#111827]"
                    >
                      Título del problema
                    </label>
                    <input
                      id={`edit-title-${report.id}`}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border-2 border-[#374151] bg-white px-3.5 py-2.5 text-[18px] text-[#111827]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`edit-details-${report.id}`}
                      className="mb-1.5 block text-[18px] font-bold text-[#111827]"
                    >
                      Detalles adicionales o dirección exacta
                    </label>
                    <textarea
                      id={`edit-details-${report.id}`}
                      rows={3}
                      value={editDetails}
                      onChange={(e) => setEditDetails(e.target.value)}
                      placeholder="Agregue referencias como calles cercanas o color de casa..."
                      className="w-full rounded-xl border-2 border-[#374151] bg-white px-3.5 py-2.5 text-[18px] text-[#111827]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => saveEdit(report.id)}
                      className="flex min-h-[56px] flex-1 items-center justify-center rounded-xl bg-[#166534] px-4 py-2.5 text-[22px] font-bold text-white hover:bg-[#14532D]"
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex min-h-[56px] items-center justify-center rounded-xl border-2 border-[#374151] bg-white px-4 py-2.5 text-[22px] font-bold text-[#111827]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-[22px] font-extrabold leading-snug text-[#111827]">
                    {report.resumen_problema}
                  </h3>
                  <p className="text-[18px] leading-relaxed text-[#374151]">
                    {report.mensaje_ciudadano}
                  </p>
                  {report.detalles_usuario && (
                    <p className="rounded-xl bg-[#FAF8F5] p-3 text-[18px] text-[#111827]">
                      <span className="font-bold">Nota agregada:</span> {report.detalles_usuario}
                    </p>
                  )}
                </div>
              )}

              {/* 4 acciones principales */}
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleListen(report)}
                  className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl bg-[#0F2C59] px-4 py-3 text-[22px] font-bold text-white hover:bg-[#0A1F40]"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Detener</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Escuchar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(report)}
                  className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 border-[#0F2C59] bg-white px-4 py-3 text-[22px] font-bold text-[#0F2C59] hover:bg-[#EEF2F8]"
                >
                  <Pencil className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyOficio(report)}
                  className={`flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[22px] font-bold sm:col-span-2 ${
                    isCopied
                      ? 'border-[#166534] bg-[#DCFCE7] text-[#166534]'
                      : 'border-[#374151] bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Oficio copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Copiar Oficio Formal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadOficio(report)}
                  className={`flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[22px] font-bold ${
                    isDownloaded
                      ? 'border-[#166534] bg-[#DCFCE7] text-[#166534]'
                      : 'border-[#374151] bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
                  }`}
                >
                  {isDownloaded ? (
                    <>
                      <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Descargado</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-6 w-6 shrink-0" aria-hidden="true" />
                      <span>Descargar Oficio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onPrintReport(report)}
                  className="flex min-h-[60px] items-center justify-center gap-2 rounded-xl border-2 border-[#374151] bg-[#FAF8F5] px-4 py-3 text-[22px] font-bold text-[#111827] hover:bg-[#EFECE6]"
                >
                  <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>

              {/* Desplegable de lectura del Oficio Formal */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOficioId((prev) => (prev === report.id ? null : report.id))
                  }
                  className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-2 py-2 text-[18px] font-bold text-[#0F2C59] hover:bg-[#EEF2F8]"
                >
                  <span>{isOficioOpen ? 'Ocultar oficio formal' : 'Leer oficio formal completo'}</span>
                  {isOficioOpen ? (
                    <ChevronUp className="h-6 w-6 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-6 w-6 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {isOficioOpen && (
                  <div className="mt-2 whitespace-pre-wrap rounded-xl border border-[#D6D3CD] bg-[#FAF8F5] p-4 text-[18px] leading-relaxed text-[#111827]">
                    {report.oficio_formal}
                  </div>
                )}
              </div>

              {/* Eliminar con confirmación accesible sin window.confirm */}
              <div className="border-t border-[#E5E2DC] pt-3">
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(report.id)}
                    className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#B91C1C] bg-white px-4 py-2.5 text-[22px] font-bold text-[#B91C1C] hover:bg-red-50"
                  >
                    <Trash2 className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border-2 border-[#B91C1C] bg-red-50 p-4">
                    <p className="text-[18px] font-bold text-[#991B1B]">
                      ¿Seguro que desea borrar este reporte de su teléfono?
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteReport(report.id);
                          setConfirmDeleteId(null);
                        }}
                        className="flex min-h-[54px] flex-1 items-center justify-center rounded-xl bg-[#B91C1C] px-4 py-2.5 text-[22px] font-bold text-white hover:bg-[#991B1B]"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex min-h-[54px] flex-1 items-center justify-center rounded-xl border-2 border-[#374151] bg-white px-4 py-2.5 text-[22px] font-bold text-[#111827]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
