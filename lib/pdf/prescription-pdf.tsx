import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: 2, borderBottomColor: "#0F9D58", paddingBottom: 12, marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: 700, color: "#0F9D58" },
  small: { fontSize: 9, color: "#555" },
  section: { marginBottom: 12 },
  label: { fontSize: 9, color: "#888", marginBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#E7F7EF", padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: 1, borderBottomColor: "#eee" },
  col1: { width: "30%" },
  col2: { width: "20%" },
  col3: { width: "20%" },
  col4: { width: "30%" },
  footer: { position: "absolute", bottom: 32, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  qr: { width: 60, height: 60 },
  signature: { width: 100, height: 40, objectFit: "contain" },
});

export interface PrescriptionPDFData {
  hospitalName: string;
  hospitalAddress?: string;
  gstNo?: string;
  doctorName: string;
  doctorQualification?: string;
  signatureUrl?: string;
  patientName: string;
  patientUHID: string;
  patientAge?: string;
  patientGender?: string;
  date: string;
  diagnoses: { code: string; label: string }[];
  items: { medicineName: string; dosage: string; frequency: string; durationDays: number; instructions?: string }[];
  qrPayload: string; // URL/token linking to the digital copy
}

function PrescriptionDocument({ data, qrDataUrl }: { data: PrescriptionPDFData; qrDataUrl: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
            {data.gstNo && <Text style={styles.small}>GSTIN: {data.gstNo}</Text>}
          </View>
          <View>
            <Text>{data.doctorName}</Text>
            {data.doctorQualification && <Text style={styles.small}>{data.doctorQualification}</Text>}
          </View>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>PATIENT</Text>
            <Text>{data.patientName} ({data.patientUHID})</Text>
            <Text style={styles.small}>{data.patientAge ?? ""} {data.patientGender ?? ""}</Text>
          </View>
          <View>
            <Text style={styles.label}>DATE</Text>
            <Text>{data.date}</Text>
          </View>
        </View>

        {data.diagnoses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>DIAGNOSIS</Text>
            {data.diagnoses.map((d, i) => (
              <Text key={i}>{d.code} — {d.label}</Text>
            ))}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Medicine</Text>
            <Text style={styles.col2}>Dosage</Text>
            <Text style={styles.col3}>Frequency / Duration</Text>
            <Text style={styles.col4}>Instructions</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.medicineName}</Text>
              <Text style={styles.col2}>{item.dosage}</Text>
              <Text style={styles.col3}>{item.frequency} — {item.durationDays}d</Text>
              <Text style={styles.col4}>{item.instructions ?? "—"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Image src={qrDataUrl} style={styles.qr} />
          <View style={{ alignItems: "center" }}>
            {data.signatureUrl && <Image src={data.signatureUrl} style={styles.signature} />}
            <Text style={styles.small}>{data.doctorName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Renders the prescription to a PDF buffer, ready to stream from an API route. */
export async function generatePrescriptionPDF(data: PrescriptionPDFData): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(data.qrPayload, { margin: 1, width: 200 });
  return renderToBuffer(<PrescriptionDocument data={data} qrDataUrl={qrDataUrl} />);
}
