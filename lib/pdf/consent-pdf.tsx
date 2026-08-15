import "server-only";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: 2, borderBottomColor: "#0F9D58", paddingBottom: 12, marginBottom: 16 },
  hospitalName: { fontSize: 18, fontWeight: 700, color: "#0F9D58" },
  small: { fontSize: 9, color: "#555" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 12, textAlign: "center" },
  content: { lineHeight: 1.5, marginBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  signatureBlock: { marginTop: 32, flexDirection: "row", justifyContent: "space-between" },
  signatureImg: { width: 160, height: 60, borderBottom: 1, borderBottomColor: "#333", objectFit: "contain" },
  label: { fontSize: 9, color: "#888", marginTop: 4 },
});

export interface ConsentPDFData {
  hospitalName: string;
  hospitalAddress?: string;
  formType: string;
  content: string;
  patientName: string;
  patientUHID: string;
  signerName: string;
  signerRelation: string;
  witnessName?: string;
  signatureDataUrl: string;
  signedAt: string;
}

function ConsentDocument({ data }: { data: ConsentPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.small}>{data.signedAt}</Text>
          </View>
        </View>

        <Text style={styles.title}>{data.formType.replace(/_/g, " ")}</Text>

        <View style={styles.row}>
          <Text>Patient: {data.patientName} ({data.patientUHID})</Text>
        </View>

        <Text style={styles.content}>{data.content}</Text>

        <View style={styles.signatureBlock}>
          <View>
            <Image src={data.signatureDataUrl} style={styles.signatureImg} />
            <Text style={styles.label}>Signature of {data.signerRelation} — {data.signerName}</Text>
          </View>
          {data.witnessName && (
            <View>
              <Text style={{ marginTop: 60, borderBottom: 1, borderBottomColor: "#333", width: 160 }}> </Text>
              <Text style={styles.label}>Witness — {data.witnessName}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

export async function generateConsentPDF(data: ConsentPDFData): Promise<Buffer> {
  return renderToBuffer(<ConsentDocument data={data} />);
}
