import { NextRequest, NextResponse } from "next/server";
import { getInvoiceById } from "@/actions/billing";
import { generateInvoicePDF } from "@/lib/pdf/invoice-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const origin = req.nextUrl.origin;

  const pdfBuffer = await generateInvoicePDF({
    hospitalName: invoice.branch.hospital.name,
    hospitalAddress: invoice.branch.hospital.address ?? undefined,
    gstNo: invoice.branch.hospital.gstNo ?? undefined,
    invoiceNo: invoice.invoiceNo,
    date: new Date(invoice.createdAt).toLocaleDateString(),
    patientName: invoice.patient.name,
    patientUHID: invoice.patient.uhid,
    patientPhone: invoice.patient.phone,
    status: invoice.status,
    items: invoice.items.map((i) => ({
      category: i.category,
      description: i.description,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      gstPercent: Number(i.gstPercent),
      amount: Number(i.amount),
    })),
    subtotal: Number(invoice.subtotal),
    gstAmount: Number(invoice.gstAmount),
    totalAmount: Number(invoice.totalAmount),
    amountPaid: Number(invoice.amountPaid),
    qrPayload: `${origin}/patient-portal/invoices/${invoice.id}`,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNo}.pdf"`,
    },
  });
}
