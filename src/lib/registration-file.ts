import Papa from "papaparse";
import { catalogFields, type CatalogKind } from "./registration-catalog";

export async function readCatalogFile(file: File, kind: CatalogKind): Promise<Record<string, unknown>[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("El archivo supera 5 MB.");
  let rows: Record<string, unknown>[];
  if (/\.csv$/i.test(file.name)) {
    const result = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: "greedy", transformHeader: h => h.replace(/^\uFEFF/, "").trim().toLowerCase() });
    rows = result.data;
    if (!catalogFields[kind].every(f => result.meta.fields?.includes(f))) throw new Error(`Columnas requeridas: ${catalogFields[kind].join(", ")}`);
    if (result.errors.length) throw new Error(`CSV inválido: ${result.errors[0]?.message}`);
  } else if (/\.xlsx$/i.test(file.name)) {
    // Excel runs only after a browser file selection; never imports Node workbook APIs into SSR.
    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await file.arrayBuffer());
    const sheet = book.worksheets[0];
    if (!sheet) throw new Error("Excel sin hojas.");
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, index) => { headers[index - 1] = cell.text.trim().toLowerCase(); });
    if (!catalogFields[kind].every(f => headers.includes(f))) throw new Error(`Columnas requeridas: ${catalogFields[kind].join(", ")}`);
    if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error("Columnas duplicadas.");
    rows = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const values: Record<string, unknown> = {};
      headers.forEach((header, col) => { if (header) { const cell = row.getCell(col + 1); if (cell.type === ExcelJS.ValueType.Formula) throw new Error(`Fila ${index}: no se admiten fórmulas.`); values[header] = cell.text; } });
      rows.push(values);
    });
  } else throw new Error("Seleccione un archivo CSV o XLSX.");
  if (!rows.length || rows.length > 500) throw new Error("El archivo debe contener entre 1 y 500 filas.");
  return rows;
}
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
export function csvText(rows: unknown[][]) { return Papa.unparse(rows); }