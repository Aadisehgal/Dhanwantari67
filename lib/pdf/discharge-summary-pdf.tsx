import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: 2, borderBottomColor: "#0F9D58", paddingBottom: 12, marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: 700, color: "#0F9D58" },
  small: { fontSize: 9, color: "#555" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  section: { marginBottom: 14 },
  label: { fontSize: 9, color: "#888", marginBottom: 3, textTransform: "uppercase" },
  body: { lineHeight: 1.5 },
});

export interface DischargeSummaryPDFData {
  hospitalName: string;
  hospitalAddress?: string;
  patientName: string;
  patientUHID: string;
  wardBed: string;
  admittedAt: string;
  dischargedAt: string;
  admittingDoctor?: string;
  admissionDiagnosis?: string;
  finalDiagnosis: string;
  treatmentSummary: string;
  followUpInstructions?: string;
  followUpDate?: string;
}

function DischargeSummaryDocument({ data }: { data: DischargeSummaryPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
          </View>
          <Text style={styles.title}>DISCHARGE SUMMARY</Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text>{data.patientName} ({data.patientUHID})</Text>
            <Text style={styles.small}>{data.wardBed}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.small}>Admitted: {data.admittedAt}</Text>
            <Text style={styles.small}>Discharged: {data.dischargedAt}</Text>
          </View>
        </View>

        {data.admittingDoctor && (
          <View style={styles.section}>
            <Text style={styles.label}>Admitting Doctor</Text>
            <Text>{data.admittingDoctor}</Text>
          </View>
        )}

        {data.admissionDiagnosis && (
          <View style={styles.section}>
            <Text style={styles.label}>Admission Diagnosis</Text>
            <Text style={styles.body}>{data.admissionDiagnosis}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Final Diagnosis</Text>
          <Text style={styles.body}>{data.finalDiagnosis}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Treatment Summary</Text>
          <Text style={styles.body}>{data.treatmentSummary}</Text>
        </View>

        {data.followUpInstructions && (
          <View style={styles.section}>
            <Text style={styles.label}>Follow-up Instructions</Text>
            <Text style={styles.body}>{data.followUpInstructions}</Text>
            {data.followUpDate && <Text style={styles.small}>Next visit: {data.followUpDate}</Text>}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateDischargeSummaryPDF(data: DischargeSummaryPDFData): Promise<Buffer> {
  return renderToBuffer(<DischargeSummaryDocument data={data} />);
}
