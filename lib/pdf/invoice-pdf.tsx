import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: 2, borderBottomColor: "#0F9D58", paddingBottom: 12, marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: 700, color: "#0F9D58" },
  small: { fontSize: 9, color: "#555" },
  billTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#E7F7EF", padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: 1, borderBottomColor: "#eee" },
  colCat: { width: "15%" },
  colDesc: { width: "35%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colGst: { width: "10%", textAlign: "right" },
  colAmt: { width: "15%", textAlign: "right" },
  summary: { marginTop: 16, alignItems: "flex-end" },
  summaryRow: { flexDirection: "row", width: 220, justifyContent: "space-between", marginBottom: 4 },
  totalRow: { flexDirection: "row", width: 220, justifyContent: "space-between", borderTop: 1, borderTopColor: "#333", paddingTop: 4, marginTop: 4, fontWeight: 700 },
  statusBadge: { marginTop: 8, alignSelf: "flex-end", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontWeight: 700 },
  footer: { position: "absolute", bottom: 32, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  qr: { width: 60, height: 60 },
});

const STATUS_COLORS: Record<string, string> = {
  PAID: "#16A34A",
  PENDING: "#F59E0B",
  PARTIALLY_PAID: "#F59E0B",
  CANCELLED: "#DC2626",
  REFUNDED: "#7C3AED",
};

export interface InvoicePDFData {
  hospitalName: string;
  hospitalAddress?: string;
  gstNo?: string;
  invoiceNo: string;
  date: string;
  patientName: string;
  patientUHID: string;
  patientPhone?: string;
  status: string;
  items: { category: string; description: string; quantity: number; unitPrice: number; gstPercent: number; amount: number }[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  amountPaid: number;
  qrPayload: string;
}

function InvoiceDocument({ data, qrDataUrl }: { data: InvoicePDFData; qrDataUrl: string }) {
  const balanceDue = data.totalAmount - data.amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
            {data.gstNo && <Text style={styles.small}>GSTIN: {data.gstNo}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.billTitle}>TAX INVOICE</Text>
            <Text style={styles.small}>{data.invoiceNo}</Text>
            <Text style={styles.small}>{data.date}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.small}>BILL TO</Text>
            <Text>{data.patientName} ({data.patientUHID})</Text>
            {data.patientPhone && <Text style={styles.small}>{data.patientPhone}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colCat}>Category</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colGst}>GST%</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colCat}>{item.category}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>Rs {item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colGst}>{item.gstPercent}%</Text>
              <Text style={styles.colAmt}>Rs {item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>Rs {data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>GST</Text>
            <Text>Rs {data.gstAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total</Text>
            <Text>Rs {data.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Paid</Text>
            <Text>Rs {data.amountPaid.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Balance Due</Text>
            <Text>Rs {balanceDue.toFixed(2)}</Text>
          </View>
          <Text style={[styles.statusBadge, { color: STATUS_COLORS[data.status] ?? "#333" }]}>
            {data.status.replace("_", " ")}
          </Text>
        </View>

        <View style={styles.footer}>
          <Image src={qrDataUrl} style={styles.qr} />
          <Text style={styles.small}>Thank you for choosing {data.hospitalName}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Renders the invoice/bill to a PDF buffer, ready to stream from an API route. */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(data.qrPayload, { margin: 1, width: 200 });
  return renderToBuffer(<InvoiceDocument data={data} qrDataUrl={qrDataUrl} />);
}
