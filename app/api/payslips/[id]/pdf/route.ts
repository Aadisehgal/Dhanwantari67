import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { generatePayslipPDF } from "@/lib/pdf/payslip-pdf";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission("HR", "EXPORT");
  const { id } = await params;

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      staff: {
        include: {
          user: { include: { branch: { include: { hospital: true } } } },
        },
      },
    },
  });

  if (!payslip) {
    return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  }

  const hospital = payslip.staff.user.branch?.hospital;

  const pdfBuffer = await generatePayslipPDF({
    hospitalName: hospital?.name ?? "Dhanwantari Healthcare",
    hospitalAddress: hospital?.address ?? undefined,
    employeeName: payslip.staff.user.name,
    employeeId: payslip.staff.employeeId,
    designation: payslip.staff.designation ?? undefined,
    department: payslip.staff.department ?? undefined,
    month: `${MONTH_NAMES[payslip.month - 1]} ${payslip.year}`,
    basicSalary: Number(payslip.basicSalary),
    hra: Number(payslip.hra),
    otherAllowance: Number(payslip.otherAllowance),
    pfDeduction: Number(payslip.pfDeduction),
    unpaidLeaveDays: payslip.unpaidLeaveDays,
    unpaidDeduction: Number(payslip.unpaidDeduction),
    netPay: Number(payslip.netPay),
    bankAccountNo: payslip.staff.bankAccountNo ?? undefined,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${payslip.staff.employeeId}-${payslip.month}-${payslip.year}.pdf"`,
    },
  });
}
