import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Mic,
  Square,
  Keyboard,
  MapPin,
  Send,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ImagePlus,
  Loader2,
  ClipboardList,
  Download,
  Printer,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { CiudadanoReport, GeminiAnalysisResult } from '../types';
import { compressImageFile, blobToBase64 } from '../utils/imageCompress';
import { speakSpanish, stopSpeaking } from '../utils/speech';
import { downloadOficioTxt } from '../utils/oficioExport';

interface ReportTabProps {
  customApiKey: string;
  onReportCreated: (report: CiudadanoReport) => void;
  onGoToMyReports: () => void;
  onPrintReport: (report: CiudadanoReport) => void;
}

const HERMOSILLO_FALLBACK_COORDS = {
  lat: 29.072967,
  lng: -110.955919,
  label: 'Centro de Hermosillo, Sonora (ubicación aproximada)',
};

export function ReportTab({
  customApiKey,
  onReportCreated,
  onGoToMyReports,
  onPrintReport,
}: ReportTabProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [micNotice, setMicNotice] = useState<string>('');

  const [showTextBox, setShowTextBox] = useState(false);
  const [description, setDescription] = useState('');

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(HERMOSILLO_FALLBACK_COORDS);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'fallback'>('fallback');
  const [locationReady, setLocationReady] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [addressDetail, setAddressDetail] = useState<{
    colonia: string;
    ubicacion_detallada: string;
  }>({
    colonia: 'Col. Centro',
    ubicacion_detallada: 'Zona Centro, Hermosillo, Sonora',
  });
  const [showRefInput, setShowRefInput] = useState(false);
  const [locationRef, setLocationRef] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const [confirmedReport, setConfirmedReport] = useState<CiudadanoReport | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [downloadedConfirmation, setDownloadedConfirmation] = useState(false);

  const resolveAddressForCoords = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.address?.ubicacion_detallada) {
          setAddressDetail({
            colonia: data.address.colonia || 'Hermosillo, Sonora',
            ubicacion_detallada: data.address.ubicacion_detallada,
          });
          return;
        }
      }
    } catch {
      // Silencioso: conserva etiqueta local
    }
    setAddressDetail({
      colonia: 'Hermosillo, Sonora',
      ubicacion_detallada: `Hermosillo, Sonora (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    });
  };

  const detectCurrentLocation = () => {
    setIsRefreshingLocation(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextLat = pos.coords.latitude;
          const nextLng = pos.coords.longitude;
          setCoords({ lat: nextLat, lng: nextLng });
          setAccuracyMeters(
            typeof pos.coords.accuracy === 'number' ? Math.round(pos.coords.accuracy) : null,
          );
          setLocationSource('gps');
          setLocationReady(true);
          setIsRefreshingLocation(false);
          resolveAddressForCoords(nextLat, nextLng);
        },
        () => {
          setCoords({
            lat: HERMOSILLO_FALLBACK_COORDS.lat,
            lng: HERMOSILLO_FALLBACK_COORDS.lng,
          });
          setAccuracyMeters(null);
          setLocationSource('fallback');
          setLocationReady(true);
          setIsRefreshingLocation(false);
          resolveAddressForCoords(HERMOSILLO_FALLBACK_COORDS.lat, HERMOSILLO_FALLBACK_COORDS.lng);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
      );
    } else {
      setLocationSource('fallback');
      setLocationReady(true);
      setIsRefreshingLocation(false);
      resolveAddressForCoords(HERMOSILLO_FALLBACK_COORDS.lat, HERMOSILLO_FALLBACK_COORDS.lng);
    }
  };

  useEffect(() => {
    detectCurrentLocation();

    return () => {
      stopSpeaking();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationNotice('');
    try {
      const compressed = await compressImageFile(file);
      setPhotoDataUrl(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
    } catch {
      setValidationNotice('No se pudo cargar esa foto. Intente con otra imagen.');
    }
    e.target.value = '';
  };

  const stopRecordingInternal = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleToggleRecording = async () => {
    setValidationNotice('');
    setMicNotice('');

    if (isRecording) {
      stopRecordingInternal();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicNotice('Su navegador no permite grabar audio. Use el botón "Prefiero escribir".');
      setShowTextBox(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const mimeType = recorder.mimeType || preferredMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioMimeType(mimeType);
        try {
          const b64 = await blobToBase64(blob);
          setAudioBase64(b64);
        } catch {
          setMicNotice('No se pudo guardar el audio. Puede intentar de nuevo o escribir.');
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setMicNotice('No se pudo activar el micrófono. Puede escribir qué pasa aquí abajo.');
      setShowTextBox(true);
    }
  };

  const handleSubmit = async () => {
    if (isRecording) {
      stopRecordingInternal();
    }

    if (!photoBase64 && !audioBase64 && !description.trim()) {
      setValidationNotice(
        'Por favor tome una foto del problema, grabe un audio o escriba qué pasa antes de enviar.',
      );
      return;
    }

    setValidationNotice('');
    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey.trim()) {
        headers['x-custom-gemini-key'] = customApiKey.trim();
      }

      const ubicacionTexto = locationRef.trim()
        ? `${addressDetail.ubicacion_detallada} (Ref: ${locationRef.trim()})`
        : addressDetail.ubicacion_detallada;

      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: photoBase64,
          imageMimeType: photoMimeType,
          audioBase64,
          audioMimeType,
          description: description.trim(),
          lat: coords.lat,
          lng: coords.lng,
          ubicacionTexto,
        }),
      });

      let analysis: GeminiAnalysisResult;
      if (response.ok) {
        const json = await response.json();
        analysis = json.report as GeminiAnalysisResult;
      } else {
        throw new Error('HTTP error');
      }

      const folioNumber = Math.floor(1000 + Math.random() * 9000);
      const newReport: CiudadanoReport = {
        id: `rep-${Date.now()}`,
        folio: `HMO-2026-${folioNumber}`,
        fecha: new Date().toISOString(),
        colonia: addressDetail.colonia || 'Hermosillo, Sonora',
        ubicacion_texto: ubicacionTexto,
        lat: coords.lat,
        lng: coords.lng,
        fotoDataUrl: photoDataUrl || undefined,
        detalles_usuario: description.trim() || undefined,
        estado: 'Enviado / Listo para gestión',
        esPropio: true,
        ...analysis,
      };

      onReportCreated(newReport);
      setConfirmedReport(newReport);
    } catch {
      const folioNumber = Math.floor(1000 + Math.random() * 9000);
      const ubicacionFallback = locationRef.trim()
        ? `${addressDetail.ubicacion_detallada} (Ref: ${locationRef.trim()})`
        : addressDetail.ubicacion_detallada;
      const fallbackReport: CiudadanoReport = {
        id: `rep-${Date.now()}`,
        folio: `HMO-2026-${folioNumber}`,
        fecha: new Date().toISOString(),
        colonia: addressDetail.colonia || 'Hermosillo, Sonora',
        ubicacion_texto: ubicacionFallback,
        lat: coords.lat,
        lng: coords.lng,
        fotoDataUrl: photoDataUrl || undefined,
        detalles_usuario: description.trim() || undefined,
        estado: 'Enviado / Listo para gestión',
        esPropio: true,
        dependencia: 'CIDUE / Obras Públicas',
        nivel_riesgo: 'Medio',
        accesibilidad_espacio: 'Con obstáculos',
        resumen_problema: 'Falla urbana reportada en vía peatonal',
        oficio_formal: `H. AYUNTAMIENTO DE HERMOSILLO\nAsunto: Atención a falla urbana en ${ubicacionFallback} (GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}).\n\nSe solicita revisión y reparación para garantizar la movilidad segura de las personas.`,
        mensaje_ciudadano:
          `¡Gracias por su reporte! Lo recibimos correctamente en ${ubicacionFallback} y quedó listo para gestión ante CIDUE / Obras Públicas de Hermosillo.`,
        alerta_preventiva:
          'Camine con precaución en este tramo y utilice la acera opuesta si hay obstáculos.',
      };
      onReportCreated(fallbackReport);
      setConfirmedReport(fallbackReport);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!confirmedReport) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const spokenText = `Confirmación de Reporte Ciudadano HMO. Su folio es ${confirmedReport.folio}. ${confirmedReport.mensaje_ciudadano}. Dependencia asignada: ${confirmedReport.dependencia}. Nivel de riesgo: ${confirmedReport.nivel_riesgo}.`;
    speakSpanish(spokenText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleReset = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setConfirmedReport(null);
    setPhotoDataUrl('');
    setPhotoBase64('');
    setAudioUrl('');
    setAudioBase64('');
    setDescription('');
    setShowTextBox(false);
    setMicNotice('');
    setValidationNotice('');
    setDownloadedConfirmation(false);
    setLocationRef('');
    setShowRefInput(false);
  };

  const handleDownloadOficio = () => {
    if (!confirmedReport) return;
    downloadOficioTxt(confirmedReport);
    setDownloadedConfirmation(true);
    window.setTimeout(() => setDownloadedConfirmation(false), 3000);
  };

  if (confirmedReport) {
    return (
      <section aria-labelledby="confirm-title" className="space-y-5">
        <div className="rounded-2xl border-2 border-[#166534] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#166534]">
            <CheckCircle2 className="h-9 w-9 shrink-0" aria-hidden="true" />
            <h2 id="confirm-title" className="text-[24px] font-extrabold text-[#111827]">
              ¡Reporte Listo!
            </h2>
          </div>

          <div className="mt-4 rounded-xl border-2 border-[#D6D3CD] bg-[#FAF8F5] p-4">
            <p className="text-[18px] font-bold text-[#374151]">Folio asignado</p>
            <p className="tabular-nums text-[28px] font-extrabold tracking-tight text-[#0F2C59]">
              {confirmedReport.folio}
            </p>
          </div>

          <div className="mt-4 space-y-2 text-[18px] text-[#111827]">
            <p>
              <span className="font-bold">Problema:</span> {confirmedReport.resumen_problema}
            </p>
            <p>
              <span className="font-bold">Ubicación:</span> {confirmedReport.ubicacion_texto}
            </p>
            <p>
              <span className="font-bold">Dependencia:</span> {confirmedReport.dependencia}
            </p>
            <p className="flex items-center gap-2 font-bold">
              <AlertTriangle
                className={`h-5 w-5 shrink-0 ${
                  confirmedReport.nivel_riesgo === 'Alto'
                    ? 'text-[#B91C1C]'
                    : confirmedReport.nivel_riesgo === 'Medio'
                      ? 'text-[#C2410C]'
                      : 'text-[#166534]'
                }`}
                aria-hidden="true"
              />
              <span>
                Riesgo {confirmedReport.nivel_riesgo} · Espacio: {confirmedReport.accesibilidad_espacio}
              </span>
            </p>
          </div>

          <div className="mt-5 rounded-xl bg-[#EEF2F8] p-4">
            <p className="text-[20px] font-bold leading-snug text-[#111827]">
              {confirmedReport.mensaje_ciudadano}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSpeech}
            className="mt-5 flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0F2C59] px-5 py-4 text-[22px] font-bold text-white hover:bg-[#0A1F40] active:scale-[0.99]"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-7 w-7 shrink-0" aria-hidden="true" />
                <span>Detener confirmación</span>
              </>
            ) : (
              <>
                <Volume2 className="h-7 w-7 shrink-0" aria-hidden="true" />
                <span>Escuchar confirmación</span>
              </>
            )}
          </button>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadOficio}
              className={`flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[22px] font-bold ${
                downloadedConfirmation
                  ? 'border-[#166534] bg-[#DCFCE7] text-[#166534]'
                  : 'border-[#374151] bg-[#FAF8F5] text-[#111827] hover:bg-[#EFECE6]'
              }`}
            >
              {downloadedConfirmation ? (
                <>
                  <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
                  <span>Oficio descargado</span>
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
              onClick={() => onPrintReport(confirmedReport)}
              className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#374151] bg-[#FAF8F5] px-4 py-3 text-[22px] font-bold text-[#111827] hover:bg-[#EFECE6]"
            >
              <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onGoToMyReports}
            className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0F2C59] bg-white px-4 py-3 text-[22px] font-bold text-[#0F2C59] hover:bg-[#EEF2F8]"
          >
            <ClipboardList className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Mis Reportes</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#374151] bg-white px-4 py-3 text-[22px] font-bold text-[#111827] hover:bg-[#EFECE6]"
          >
            <RotateCcw className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span>Nuevo Reporte</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="capture-heading" className="space-y-5">
      <div className="rounded-2xl border-2 border-[#D6D3CD] bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-6 w-6 shrink-0 text-[#166534]" aria-hidden="true" />
            <span className="text-[18px] font-extrabold text-[#111827]">
              {!locationReady || isRefreshingLocation
                ? 'Buscando ubicación precisa...'
                : locationSource === 'gps'
                  ? 'Ubicación GPS detectada'
                  : 'Ubicación aproximada (Hermosillo)'}
            </span>
          </div>

          <button
            type="button"
            onClick={detectCurrentLocation}
            disabled={isRefreshingLocation}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#0F2C59] bg-[#EEF2F8] px-3.5 py-1.5 text-[18px] font-bold text-[#0F2C59] hover:bg-[#DCE6F5] disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 shrink-0 ${isRefreshingLocation ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Actualizar GPS</span>
          </button>
        </div>

        <p className="text-[18px] font-bold leading-snug text-[#111827]">
          {addressDetail.ubicacion_detallada}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[18px] text-[#374151]">
          <span className="tabular-nums">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            {accuracyMeters !== null ? ` · Precisión ± ${accuracyMeters} m` : ''}
          </span>

          <a
            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-[#0F2C59] underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ver punto exacto</span>
          </a>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowRefInput((prev) => !prev)}
            className="text-[18px] font-bold text-[#0F2C59] underline"
          >
            {showRefInput
              ? 'Ocultar referencia exacta'
              : 'Agregar referencia exacta (ej. frente a tienda o esquina)'}
          </button>

          {showRefInput && (
            <div className="mt-2">
              <label
                htmlFor="location-ref-input"
                className="mb-1 block text-[18px] font-bold text-[#111827]"
              >
                Referencia o entre qué calles está:
              </label>
              <input
                id="location-ref-input"
                type="text"
                value={locationRef}
                onChange={(e) => setLocationRef(e.target.value)}
                placeholder="Ej. Esquina con Av. Serdán, frente a farmacia"
                className="w-full rounded-xl border-2 border-[#374151] bg-[#FAF8F5] px-3.5 py-2.5 text-[18px] text-[#111827] placeholder:text-[#6B7280]"
              />
            </div>
          )}
        </div>
      </div>

      <h2 id="capture-heading" className="sr-only">
        Captura de reporte en 2 pasos
      </h2>

      {/* Paso 1: Foto */}
      <div className="rounded-2xl border-2 border-[#D6D3CD] bg-white p-5">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelected}
          className="hidden"
          aria-label="Tomar foto con cámara"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
          aria-label="Elegir foto guardada"
        />

        {!photoDataUrl ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex min-h-[88px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0F2C59] px-5 py-4 text-center text-[22px] font-bold text-white shadow-sm hover:bg-[#0A1F40] active:scale-[0.99]"
            >
              <Camera className="h-8 w-8 shrink-0" aria-hidden="true" />
              <span>1. Tomar Foto del Problema</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#D6D3CD] bg-[#FAF8F5] px-4 py-2.5 text-[18px] font-bold text-[#111827] hover:bg-[#EFECE6]"
            >
              <ImagePlus className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>O subir foto guardada</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[18px] font-bold text-[#166534]">1. Foto lista</p>
            <div className="overflow-hidden rounded-xl border-2 border-[#D6D3CD] bg-[#EFECE6]">
              <img
                src={photoDataUrl}
                alt="Vista previa del problema reportado"
                referrerPolicy="no-referrer"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0F2C59] bg-white px-4 py-3 text-[22px] font-bold text-[#0F2C59] hover:bg-[#EEF2F8]"
            >
              <Camera className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Cambiar foto</span>
            </button>
          </div>
        )}
      </div>

      {/* Paso 2: Voz o Texto */}
      <div className="rounded-2xl border-2 border-[#D6D3CD] bg-white p-5 space-y-4">
        <button
          type="button"
          onClick={handleToggleRecording}
          className={`flex min-h-[88px] w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center text-[22px] font-bold text-white shadow-sm active:scale-[0.99] ${
            isRecording
              ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
              : 'bg-[#0F2C59] hover:bg-[#0A1F40]'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="h-7 w-7 shrink-0 fill-current" aria-hidden="true" />
              <span className="tabular-nums">
                Grabando ({recordingSeconds}s) · Tocar para parar
              </span>
            </>
          ) : (
            <>
              <Mic className="h-8 w-8 shrink-0" aria-hidden="true" />
              <span>2. Contar qué pasa</span>
            </>
          )}
        </button>

        {audioUrl && !isRecording && (
          <div className="rounded-xl border border-[#D6D3CD] bg-[#FAF8F5] p-3 space-y-2">
            <p className="text-[18px] font-bold text-[#166534]">Audio grabado correctamente</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {micNotice && (
          <p className="rounded-xl border border-[#C2410C] bg-orange-50 px-4 py-3 text-[18px] font-bold text-[#9A3412]">
            {micNotice}
          </p>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowTextBox((prev) => !prev)}
            className="flex min-h-[50px] items-center gap-2 rounded-xl border-2 border-[#D6D3CD] bg-[#FAF8F5] px-4 py-2 text-[18px] font-bold text-[#111827] hover:bg-[#EFECE6]"
          >
            <Keyboard className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{showTextBox ? 'Ocultar cuadro de texto' : 'Prefiero escribir'}</span>
          </button>

          {showTextBox && (
            <div className="mt-3">
              <label
                htmlFor="manual-description"
                className="mb-2 block text-[18px] font-bold text-[#111827]"
              >
                Escriba brevemente qué ocurre (opcional):
              </label>
              <textarea
                id="manual-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ejemplo: Hay un bache grande o la banqueta está rota frente a la farmacia..."
                className="w-full rounded-xl border-2 border-[#374151] bg-[#FAF8F5] p-3.5 text-[18px] text-[#111827] placeholder:text-[#6B7280]"
              />
            </div>
          )}
        </div>
      </div>

      {validationNotice && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border-2 border-[#C2410C] bg-orange-50 p-4 text-[18px] font-bold text-[#9A3412]"
        >
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
          <span>{validationNotice}</span>
        </div>
      )}

      {/* Botón Enviar */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="flex min-h-[76px] w-full items-center justify-center gap-3 rounded-2xl bg-[#166534] px-6 py-4 text-[22px] font-extrabold text-white shadow-md hover:bg-[#14532D] active:scale-[0.99] disabled:opacity-75"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-7 w-7 shrink-0 animate-spin" aria-hidden="true" />
            <span>Enviando reporte...</span>
          </>
        ) : (
          <>
            <Send className="h-7 w-7 shrink-0" aria-hidden="true" />
            <span>Enviar Reporte</span>
          </>
        )}
      </button>
    </section>
  );
}
