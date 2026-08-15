import { describe, it, expect } from "vitest";
import { calculatePayslip } from "@/lib/payroll-utils";

describe("calculatePayslip", () => {
  it("computes HRA as 40% and PF as 12% of basic salary with no leave deductions", () => {
    const result = calculatePayslip(30000, 30, 0);
    expect(result.hra).toBe(12000);
    expect(result.pfDeduction).toBe(3600);
    expect(result.unpaidDeduction).toBe(0);
    expect(result.netPay).toBe(38400);
  });

  it("pro-rates unpaid leave days against gross (basic + HRA + allowance)", () => {
    const result = calculatePayslip(30000, 30, 3, 0);
    expect(result.unpaidDeduction).toBe(4200);
    expect(result.netPay).toBe(42000 - 3600 - 4200);
  });

  it("never returns a negative net pay even with excessive unpaid leave", () => {
    const result = calculatePayslip(10000, 30, 30);
    expect(result.netPay).toBeGreaterThanOrEqual(0);
  });

  it("includes other allowances in gross earnings", () => {
    const withAllowance = calculatePayslip(20000, 30, 0, 5000);
    const withoutAllowance = calculatePayslip(20000, 30, 0, 0);
    expect(withAllowance.netPay).toBe(withoutAllowance.netPay + 5000);
  });
});
