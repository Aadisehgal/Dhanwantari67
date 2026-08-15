import "server-only";

export interface PayrollResult {
  basicSalary: number;
  hra: number;
  otherAllowance: number;
  pfDeduction: number;
  unpaidLeaveDays: number;
  unpaidDeduction: number;
  netPay: number;
}

const HRA_PERCENT = 0.4; // 40% of basic - common Indian payroll convention
const PF_PERCENT = 0.12; // 12% employee PF contribution

/**
 * Computes a monthly payslip using a standard, transparent formula:
 * HRA = 40% of basic, PF = 12% of basic, unpaid-leave days deducted
 * pro-rata from (basic + HRA). No external payroll service involved.
 */
export function calculatePayslip(
  basicSalary: number,
  daysInMonth: number,
  unpaidLeaveDays: number,
  otherAllowance = 0
): PayrollResult {
  const hra = Math.round(basicSalary * HRA_PERCENT);
  const pfDeduction = Math.round(basicSalary * PF_PERCENT);

  const grossMonthly = basicSalary + hra + otherAllowance;
  const perDayRate = grossMonthly / daysInMonth;
  const unpaidDeduction = Math.round(perDayRate * unpaidLeaveDays);

  const netPay = grossMonthly - pfDeduction - unpaidDeduction;

  return {
    basicSalary,
    hra,
    otherAllowance,
    pfDeduction,
    unpaidLeaveDays,
    unpaidDeduction,
    netPay: Math.max(0, netPay),
  };
}
