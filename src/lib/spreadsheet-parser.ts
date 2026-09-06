import * as XLSX from "xlsx";

export interface ParsedSpreadsheet {
  headers: string[];
  rawRows: Record<string, string>[];
  totalCount: number;
  fileName: string;
}

export interface ValidationIssue {
  rowIndex: number;
  rowNumber: number;
  field: string;
  error: string;
  value: string;
}

export interface ValidatedRecipientRow {
  index: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ParseAndValidationResult {
  headers: string[];
  totalRows: number;
  validRows: ValidatedRecipientRow[];
  invalidRows: ValidatedRecipientRow[];
  suggestedMapping: Record<string, string>; // certificateVariableKey -> spreadsheetHeader
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parses a File (.xlsx, .xls, .csv) into headers and raw string records
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The uploaded spreadsheet contains no sheets.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  if (!jsonRows || jsonRows.length === 0) {
    throw new Error("The spreadsheet contains no data rows.");
  }

  // Extract all unique headers from all rows
  const headerSet = new Set<string>();
  jsonRows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const trimmed = key.trim();
      if (trimmed) headerSet.add(trimmed);
    });
  });

  const headers = Array.from(headerSet);

  // Normalize all values to clean strings
  const rawRows: Record<string, string>[] = jsonRows.map((row) => {
    const cleanRow: Record<string, string> = {};
    headers.forEach((h) => {
      cleanRow[h] = row[h] !== undefined && row[h] !== null ? String(row[h]).trim() : "";
    });
    return cleanRow;
  });

  return {
    headers,
    rawRows,
    totalCount: rawRows.length,
    fileName: file.name,
  };
}

/**
 * Suggests default mapping between spreadsheet columns and standard certificate variables
 */
export function autoSuggestColumnMapping(
  spreadsheetHeaders: string[],
  certificateVariables: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  certificateVariables.forEach((variableKey) => {
    const lowerVar = variableKey.toLowerCase();

    // 1. Exact match
    const exactMatch = spreadsheetHeaders.find(
      (h) => h.toLowerCase() === lowerVar
    );
    if (exactMatch) {
      mapping[variableKey] = exactMatch;
      return;
    }

    // 2. Common synonyms
    if (lowerVar === "name") {
      const nameMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return (
          l.includes("name") ||
          l.includes("participant") ||
          l.includes("attendee") ||
          l.includes("student")
        );
      });
      if (nameMatch) mapping[variableKey] = nameMatch;
    } else if (lowerVar === "email") {
      const emailMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return l.includes("email") || l.includes("mail");
      });
      if (emailMatch) mapping[variableKey] = emailMatch;
    } else if (lowerVar === "event") {
      const eventMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return (
          l.includes("event") ||
          l.includes("course") ||
          l.includes("workshop") ||
          l.includes("program")
        );
      });
      if (eventMatch) mapping[variableKey] = eventMatch;
    } else if (lowerVar === "date") {
      const dateMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return l.includes("date") || l.includes("issued");
      });
      if (dateMatch) mapping[variableKey] = dateMatch;
    } else if (lowerVar === "position") {
      const posMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return (
          l.includes("position") ||
          l.includes("role") ||
          l.includes("rank") ||
          l.includes("grade") ||
          l.includes("award")
        );
      });
      if (posMatch) mapping[variableKey] = posMatch;
    } else if (lowerVar === "certificate_id") {
      const idMatch = spreadsheetHeaders.find((h) => {
        const l = h.toLowerCase();
        return (
          l.includes("id") ||
          l.includes("code") ||
          l.includes("ref") ||
          l.includes("serial")
        );
      });
      if (idMatch) mapping[variableKey] = idMatch;
    }
  });

  return mapping;
}

/**
 * Validates spreadsheet records given an active column mapping
 */
export function validateMappedRecipients(
  rawRows: Record<string, string>[],
  columnMapping: Record<string, string> // variableKey -> spreadsheetColumn
): {
  validRows: ValidatedRecipientRow[];
  invalidRows: ValidatedRecipientRow[];
} {
  const seenEmails = new Set<string>();
  const validRows: ValidatedRecipientRow[] = [];
  const invalidRows: ValidatedRecipientRow[] = [];

  const nameColumn = columnMapping["name"];
  const emailColumn = columnMapping["email"];

  rawRows.forEach((row, idx) => {
    const rowErrors: string[] = [];

    // 1. Name Check (if mapped)
    if (nameColumn) {
      const nameVal = row[nameColumn] || "";
      if (!nameVal.trim()) {
        rowErrors.push("Recipient name is required but empty.");
      }
    }

    // 2. Email Check (if mapped)
    if (emailColumn) {
      const emailVal = (row[emailColumn] || "").toLowerCase().trim();
      if (!emailVal) {
        rowErrors.push("Email address is missing.");
      } else if (!EMAIL_REGEX.test(emailVal)) {
        rowErrors.push(`Invalid email format: "${emailVal}".`);
      } else if (seenEmails.has(emailVal)) {
        rowErrors.push(`Duplicate email found: "${emailVal}".`);
      } else {
        seenEmails.add(emailVal);
      }
    }

    // Build mapped recipient object
    const mappedData: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([varKey, colName]) => {
      mappedData[varKey] = row[colName] || "";
    });

    const validatedItem: ValidatedRecipientRow = {
      index: idx,
      data: mappedData,
      isValid: rowErrors.length === 0,
      errors: rowErrors,
    };

    if (validatedItem.isValid) {
      validRows.push(validatedItem);
    } else {
      invalidRows.push(validatedItem);
    }
  });

  return { validRows, invalidRows };
}
