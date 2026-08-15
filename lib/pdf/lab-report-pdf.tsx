import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: 2, borderBottomColor: "#0F9D58", paddingBottom: 12, marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: 700, color: "#0F9D58" },
  small: { fontSize: 9, color: "#555" },
  title: { fontSize: 14, fontWeight: 700 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  table: { marginTop: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: "#E7F7EF", padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 8, borderBottom: 1, borderBottomColor: "#eee" },
  colTest: { width: "30%" },
  colValue: { width: "20%" },
  colUnit: { width: "15%" },
  colRange: { width: "25%" },
  colFlag: { width: "10%", textAlign: "center" },
  abnormal: { color: "#DC2626", fontWeight: 700 },
  footer: { position: "absolute", bottom: 32, left: 32, right: 32 },
});

export interface LabReportPDFData {
  hospitalName: string;
  hospitalAddress?: string;
  patientName: string;
  patientUHID: string;
  patientGender?: string;
  orderedByDoctor?: string;
  sampleCollectedAt?: string;
  releasedAt?: string;
  tests: {
    name: string;
    value: string;
    unit?: string;
    normalRange?: string;
    isAbnormal: boolean;
    remarks?: string;
  }[];
}

function LabReportDocument({ data }: { data: LabReportPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
          </View>
          <Text style={styles.title}>LABORATORY REPORT</Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text>{data.patientName} ({data.patientUHID})</Text>
            {data.patientGender && <Text style={styles.small}>{data.patientGender}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {data.orderedByDoctor && <Text style={styles.small}>Ref. Doctor: {data.orderedByDoctor}</Text>}
            {data.sampleCollectedAt && <Text style={styles.small}>Sample collected: {data.sampleCollectedAt}</Text>}
            {data.releasedAt && <Text style={styles.small}>Released: {data.releasedAt}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colTest}>Test</Text>
            <Text style={styles.colValue}>Result</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colRange}>Reference Range</Text>
            <Text style={styles.colFlag}>Flag</Text>
          </View>
          {data.tests.map((t, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colTest}>{t.name}</Text>
              <Text style={[styles.colValue, t.isAbnormal ? styles.abnormal : {}]}>{t.value}</Text>
              <Text style={styles.colUnit}>{t.unit ?? "-"}</Text>
              <Text style={styles.colRange}>{t.normalRange ?? "-"}</Text>
              <Text style={styles.colFlag}>{t.isAbnormal ? "H/L" : "N"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.small}>This is a computer-generated report. H/L indicates a result outside the reference range.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateLabReportPDF(data: LabReportPDFData): Promise<Buffer> {
  return renderToBuffer(<LabReportDocument data={data} />);
}
