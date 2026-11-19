// OWNER: Lopez, Mary Vincent — WBS 8.8
// Protect spreadsheet users from formulas and preserve commas, quotes, and line breaks.
export function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function makeCsv(headers, rows) {
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function downloadCsv(filename, headers, rows) {
  const url = URL.createObjectURL(new Blob([makeCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdf(filename, title, summary, tables) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  const titleLines = pdf.splitTextToSize(title, 180);
  pdf.text(titleLines, 14, 18);
  pdf.setFontSize(10);
  const summaryLines = pdf.splitTextToSize(summary, 180);
  const summaryY = 22 + titleLines.length * 7;
  pdf.text(summaryLines, 14, summaryY);
  let startY = summaryY + summaryLines.length * 5 + 5;
  for (const table of tables) {
    autoTable(pdf, {
      startY, head: [table.headers], body: table.rows.map((row) => row.map((v) => v ?? '—')),
      styles: { fontSize: 9, overflow: 'linebreak' }, margin: { top: 15, bottom: 18 },
    });
    startY = pdf.lastAutoTable.finalY + 12;
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); pdf.setFontSize(9);
    pdf.text('EduTrack · Page ' + page + ' of ' + pages, 14, pdf.internal.pageSize.getHeight() - 8);
  }
  pdf.save(filename);
}
