import * as XLSX from "xlsx";

/**
 * Reads Excel data starting from a given row until an empty row is found.
 * A row is considered empty if all its cells are blank or undefined.
 *
 * @param file Excel File (browser) or Buffer (server)
 * @param startRow Row index to start reading (1-based)
 * @returns Array of rows until the first empty row
 */
export async function readExcelMt5(file: File | Buffer, startRow = 3) {
  let workbook;

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: "array" });
  } else {
    workbook = XLSX.read(file, { type: "buffer" });
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Read as array of arrays for easier inspection
  const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Start reading from startRow - 1 (0-based index)
  const result: any[] = [];
  // Loop from the starting row (1-based → 0-based)
  for (let i = startRow - 1; i < allRows.length; i++) {
    const row = allRows[i];

    // Make sure row exists and is an array
    if (!Array.isArray(row)) continue;

    const isEmpty = row.every(
      (cell) => cell === "Orders" || cell === undefined || cell === ""
    );
    if (isEmpty) break;

    result.push(row);
  }

  return result;
}
