export function parseExcelTime(timeStr: string) {
  // "2025.07.01 11:33:17" → "2025-07-01T11:33:17"
  const isoStr = timeStr.replace(/\./g, "-").replace(" ", "T");
  return new Date(isoStr);
}
