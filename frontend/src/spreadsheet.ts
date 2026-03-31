import * as XLSX from 'xlsx';

export type SpreadsheetRow = Record<string, string | number>;

function normalizeText(value: unknown) {
  return Array.from(String(value ?? ''))
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeSpreadsheetValue(value: string | number) {
  const normalized = normalizeText(value);

  if (/^[=+\-@]/.test(normalized)) {
    return `'${normalized}`;
  }

  return normalized;
}

export async function readSpreadsheetFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    return [] as Record<string, string>[];
  }

  return XLSX.utils
    .sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })
    .map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeText(key), normalizeText(value)])),
    );
}

export function downloadWorkbook(fileName: string, sheetName: string, rows: SpreadsheetRow[]) {
  const sanitizedRows = rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeSpreadsheetValue(value)])),
  );
  const worksheet = XLSX.utils.json_to_sheet(sanitizedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}
