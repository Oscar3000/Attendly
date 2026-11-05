// The API rejects a whole list over one row past this, so it's caught here
const MAX_PLUS_ONES = 50;

export interface GuestRow {
  name: string;
  plusOne: number;
}

/**
 * A guest list as CSV: name, then plus-ones (optional). The header row is optional too. Rows that
 * can't be read are skipped and described in `errors`, by their row number in the file
 */
export function parseGuestCsv(text: string): { rows: GuestRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: GuestRow[] = [];

  // Excel's "CSV UTF-8" starts the file with a byte order mark
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return { rows, errors };

  const first = parseCsvLine(lines[0]!);
  const hasHeader = first.some((column) => column.trim().toLowerCase() === "name");
  let nameIndex = 0;
  let plusOneIndex = 1;

  if (hasHeader) {
    nameIndex = first.findIndex((column) => column.trim().toLowerCase() === "name");
    plusOneIndex = first.findIndex((column) => /^(plus[\s_-]?ones?|guests?)$/i.test(column.trim()));
  }

  (hasHeader ? lines.slice(1) : lines).forEach((line, i) => {
    const columns = parseCsvLine(line);
    const rowNumber = i + (hasHeader ? 2 : 1);
    const name = (columns[nameIndex] ?? "").trim();
    if (!name) {
      errors.push(`Row ${rowNumber}: missing name`);
      return;
    }
    const plusOnes = plusOneIndex >= 0 ? (columns[plusOneIndex] ?? "").trim() : "";
    if (plusOnes !== "" && !/^\d+$/.test(plusOnes)) {
      errors.push(`Row ${rowNumber}: invalid plus-ones "${plusOnes}"`);
      return;
    }
    const plusOne = plusOnes === "" ? 0 : Number(plusOnes);
    if (plusOne > MAX_PLUS_ONES) {
      errors.push(`Row ${rowNumber}: at most ${MAX_PLUS_ONES} plus-ones`);
      return;
    }
    rows.push({ name, plusOne });
  });

  return { rows, errors };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const character = line[i]!;
    if (inQuotes) {
      if (character === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        current += character;
      }
    } else if (character === ",") {
      result.push(current);
      current = "";
    } else if (character === '"') {
      inQuotes = true;
    } else {
      current += character;
    }
  }
  result.push(current);
  return result;
}
