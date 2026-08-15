import "server-only";

/** Generates a scannable sample barcode: LAB-branchcode-timestamp-random. */
export function generateSampleBarcode(branchCode: string): string {
  const stamp = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `LAB${branchCode}${stamp}${rand}`.toUpperCase();
}

/**
 * Rule-based abnormal-flag detection: parses a "low-high" numeric range
 * (e.g. "70-110", "4.5 - 11.0") and compares the numeric result value
 * against it. Falls back to false if either side isn't a plain number —
 * deliberately simple/transparent, no ML involved.
 */
export function isValueAbnormal(value: string, normalRange?: string | null): boolean {
  if (!normalRange) return false;

  const numericValue = parseFloat(value);
  if (Number.isNaN(numericValue)) return false;

  const match = normalRange.match(/(-?\d+(\.\d+)?)\s*-\s*(-?\d+(\.\d+)?)/);
  if (!match) return false;

  const low = parseFloat(match[1]!);
  const high = parseFloat(match[3]!);

  return numericValue < low || numericValue > high;
}
