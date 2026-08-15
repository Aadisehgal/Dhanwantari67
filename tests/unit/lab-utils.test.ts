import { describe, it, expect } from "vitest";
import { isValueAbnormal, generateSampleBarcode } from "@/lib/lab-utils";

describe("isValueAbnormal", () => {
  it("flags a value below the normal range as abnormal", () => {
    expect(isValueAbnormal("60", "70-110")).toBe(true);
  });

  it("flags a value above the normal range as abnormal", () => {
    expect(isValueAbnormal("150", "70-110")).toBe(true);
  });

  it("does not flag a value within the normal range", () => {
    expect(isValueAbnormal("90", "70-110")).toBe(false);
  });

  it("handles decimal ranges", () => {
    expect(isValueAbnormal("5.2", "0.4-4.0")).toBe(true);
    expect(isValueAbnormal("2.1", "0.4-4.0")).toBe(false);
  });

  it("returns false gracefully when the value isn't numeric", () => {
    expect(isValueAbnormal("Negative", "70-110")).toBe(false);
  });

  it("returns false when no reference range is available", () => {
    expect(isValueAbnormal("100", null)).toBe(false);
    expect(isValueAbnormal("100", undefined)).toBe(false);
  });
});

describe("generateSampleBarcode", () => {
  it("produces an uppercase alphanumeric barcode prefixed with LAB and the branch code", () => {
    const barcode = generateSampleBarcode("PUN");
    expect(barcode.startsWith("LABPUN")).toBe(true);
    expect(barcode).toMatch(/^[A-Z0-9]+$/);
  });

  it("produces different barcodes on successive calls", () => {
    const a = generateSampleBarcode("PUN");
    const b = generateSampleBarcode("PUN");
    expect(a).not.toBe(b);
  });
});
