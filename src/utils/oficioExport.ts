import { jsPDF } from 'jspdf';
import type { CiudadanoReport } from '../types';

export function formatOficioDocumentText(report: CiudadanoReport): string {
  const fechaFormateada = new Date(report.fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    '============================================================',
    'REPORTE CIUDADANO HMO - RESPALDO DE OFICIO FORMAL',
    '============================================================',
    `Folio: ${report.folio}`,
    `Fecha de emisión: ${fechaFormateada}`,
    `Dependencia asignada: ${report.dependencia}`,
    `Estado: ${report.estado}`,
    `Nivel de riesgo: ${report.nivel_riesgo}`,
    `Accesibilidad del espacio: ${report.accesibilidad_espacio}`,
    `Ubicación: ${report.ubicacion_texto}`,
    `Coordenadas GPS: ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`,
    `Enlace de mapa: https://www.google.com/maps?q=${report.lat},${report.lng}`,
    '------------------------------------------------------------',
    '',
    report.oficio_formal,
    '',
  ];

  if (report.detalles_usuario?.trim()) {
    lines.push('------------------------------------------------------------');
    lines.push(`Detalles adicionales del ciudadano: ${report.detalles_usuario.trim()}`);
    lines.push('');
  }

  lines.push('============================================================');
  return lines.join('\n');
}

export function downloadOficioTxt(report: CiudadanoReport): void {
  const content = formatOficioDocumentText(report);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Oficio_${report.folio}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function sanitizeForPdfFont(text: string): string {
  // Keep Latin-1 Spanish characters (áéíóúüñÁÉÍÓÚÜÑ¿¡) and standard punctuation;
  // replace unsupported Unicode symbols/emojis cleanly.
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

function loadImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width || 4, height: img.height || 3 });
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = dataUrl;
  });
}

export async function downloadOficioPdf(report: CiudadanoReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // Encabezado oficial
  doc.setFillColor(15, 44, 89);
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(sanitizeForPdfFont('HERMOSILLO, SONORA · REPORTE CIUDADANO HMO'), margin + 5, y + 7);

  doc.setFontSize(15);
  doc.text(sanitizeForPdfFont('Oficio Formal de Atención Ciudadana'), margin + 5, y + 16);

  doc.setFontSize(11);
  doc.text(sanitizeForPdfFont(`FOLIO: ${report.folio}`), pageWidth - margin - 5, y + 16, {
    align: 'right',
  });

  y += 28;
  doc.setTextColor(17, 24, 39);

  // Cuadro de datos del reporte
  const fechaFormateada = new Date(report.fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const metaLines = [
    `Fecha: ${fechaFormateada}`,
    `Dependencia asignada: ${report.dependencia}`,
    `Estado: ${report.estado}`,
    `Riesgo: ${report.nivel_riesgo}   |   Accesibilidad: ${report.accesibilidad_espacio}`,
    `Ubicación: ${report.ubicacion_texto}`,
    `Coordenadas GPS: ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`,
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const wrappedMeta = metaLines.flatMap((line) =>
    doc.splitTextToSize(sanitizeForPdfFont(line), contentWidth - 8),
  );
  const metaBoxHeight = wrappedMeta.length * 5.2 + 7;

  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(250, 248, 245);
  doc.rect(margin, y, contentWidth, metaBoxHeight, 'FD');

  let metaY = y + 6.5;
  for (const line of wrappedMeta) {
    doc.text(line, margin + 4, metaY);
    metaY += 5.2;
  }

  y += metaBoxHeight + 8;

  // Cuerpo del oficio formal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitizeForPdfFont('Cuerpo del Oficio Formal'), margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(sanitizeForPdfFont(report.oficio_formal), contentWidth);
  for (const line of bodyLines) {
    ensureSpace(6);
    doc.text(line, margin, y);
    y += 5.4;
  }

  if (report.detalles_usuario?.trim()) {
    y += 4;
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sanitizeForPdfFont('Notas adicionales del ciudadano:'), margin, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(
      sanitizeForPdfFont(report.detalles_usuario.trim()),
      contentWidth,
    );
    for (const line of noteLines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5.4;
    }
  }

  // Evidencia fotográfica si existe
  if (report.fotoDataUrl && report.fotoDataUrl.startsWith('data:image/')) {
    try {
      const dims = await loadImageDimensions(report.fotoDataUrl);
      const maxImgW = 95;
      const maxImgH = 65;
      const ratio = Math.min(maxImgW / dims.width, maxImgH / dims.height);
      const drawW = dims.width * ratio;
      const drawH = dims.height * ratio;

      y += 6;
      ensureSpace(drawH + 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(sanitizeForPdfFont('Evidencia Fotográfica'), margin, y);
      y += 4;

      const format = report.fotoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(report.fotoDataUrl, format, margin, y, drawW, drawH);
      y += drawH + 8;
    } catch {
      // Si la imagen no se puede incrustar, continúa sin bloquear el PDF
    }
  }

  // Firmas / Sello de recibido
  y += 10;
  ensureSpace(26);
  const sigWidth = (contentWidth - 16) / 2;
  doc.setDrawColor(17, 24, 39);
  doc.line(margin, y + 12, margin + sigWidth, y + 12);
  doc.line(margin + sigWidth + 16, y + 12, margin + contentWidth, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(sanitizeForPdfFont('Firma del Ciudadano / Solicitante'), margin, y + 17);
  doc.text(
    sanitizeForPdfFont('Sello y Fecha de Recibido (Ayuntamiento)'),
    margin + sigWidth + 16,
    y + 17,
  );

  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Oficio_${report.folio}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}
