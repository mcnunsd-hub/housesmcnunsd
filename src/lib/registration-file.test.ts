import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { readCatalogFile } from "./registration-file";
describe("Catalog file input", () => {
  it("reads quoted CSV without losing commas in names", async () => {
    const file = new File(['name,active,sort_order\n"PRUEBA, CSV",true,0'], "test.csv");
    expect(await readCatalogFile(file, "committees")).toEqual([{ name: "PRUEBA, CSV", active: "true", sort_order: "0" }]);
  });
  it("rejects missing CSV columns", async () => {
    await expect(readCatalogFile(new File(["name\nPRUEBA"], "test.csv"), "committees")).rejects.toThrow("Columnas requeridas");
  });
  it("reads XLSX and rejects formula cells", async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("PRUEBA");
    sheet.addRow(["name", "active", "sort_order"]);
    sheet.addRow(["PRUEBA EXCEL", "false", 3]);
    const bytes = await book.xlsx.writeBuffer();
    expect(await readCatalogFile(new File([new Uint8Array(bytes)], "test.xlsx"), "committees")).toEqual([{ name: "PRUEBA EXCEL", active: "false", sort_order: "3" }]);
    sheet.getCell("C2").value = { formula: "1+2", result: 3 };
    const formulaBytes = await book.xlsx.writeBuffer();
    await expect(readCatalogFile(new File([new Uint8Array(formulaBytes)], "test.xlsx"), "committees")).rejects.toThrow("no se admiten fórmulas");
  });
});