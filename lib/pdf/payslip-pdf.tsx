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
  table: { marginTop: 12, flexDirection: "row" },
  col: { width: "50%", paddingRight: 12 },
  lineItem: { flexDirection: "row", justifyContent: "space-between", padding: 6, borderBottom: 1, borderBottomColor: "#eee" },
  sectionLabel: { fontSize: 9, fontWeight: 700, color: "#0F9D58", marginBottom: 4, textTransform: "uppercase" },
  netPayBox: { marginTop: 20, padding: 12, backgroundColor: "#E7F7EF", borderRadius: 4, flexDirection: "row", justifyContent: "space-between" },
  netPayLabel: { fontSize: 12, fontWeight: 700, color: "#0F9D58" },
});

export interface PayslipPDFData {
  hospitalName: string;
  hospitalAddress?: string;
  employeeName: string;
  employeeId: string;
  designation?: string;
  department?: string;
  month: string;
  basicSalary: number;
  hra: number;
  otherAllowance: number;
  pfDeduction: number;
  unpaidLeaveDays: number;
  unpaidDeduction: number;
  netPay: number;
  bankAccountNo?: string;
}

function PayslipDocument({ data }: { data: PayslipPDFData }) {
  const grossEarnings = data.basicSalary + data.hra + data.otherAllowance;
  const totalDeductions = data.pfDeduction + data.unpaidDeduction;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hospitalName}>{data.hospitalName}</Text>
            {data.hospitalAddress && <Text style={styles.small}>{data.hospitalAddress}</Text>}
          </View>
          <Text style={styles.title}>PAYSLIP - {data.month}</Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text>{data.employeeName}</Text>
            <Text style={styles.small}>Employee ID: {data.employeeId}</Text>
            {data.designation && <Text style={styles.small}>{data.designation}{data.department ? ` - ${data.department}` : ""}</Text>}
          </View>
          {data.bankAccountNo && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.small}>Bank A/C: {data.bankAccountNo}</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Earnings</Text>
            <View style={styles.lineItem}><Text>Basic Salary</Text><Text>Rs {data.basicSalary.toFixed(2)}</Text></View>
            <View style={styles.lineItem}><Text>HRA</Text><Text>Rs {data.hra.toFixed(2)}</Text></View>
            <View style={styles.lineItem}><Text>Other Allowance</Text><Text>Rs {data.otherAllowance.toFixed(2)}</Text></View>
            <View style={[styles.lineItem, { fontWeight: 700 }]}><Text>Gross Earnings</Text><Text>Rs {grossEarnings.toFixed(2)}</Text></View>
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Deductions</Text>
            <View style={styles.lineItem}><Text>Provident Fund (PF)</Text><Text>Rs {data.pfDeduction.toFixed(2)}</Text></View>
            <View style={styles.lineItem}>
              <Text>Unpaid Leave ({data.unpaidLeaveDays} day{data.unpaidLeaveDays === 1 ? "" : "s"})</Text>
              <Text>Rs {data.unpaidDeduction.toFixed(2)}</Text>
            </View>
            <View style={[styles.lineItem, { fontWeight: 700 }]}><Text>Total Deductions</Text><Text>Rs {totalDeductions.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>NET PAY</Text>
          <Text style={styles.netPayLabel}>Rs {data.netPay.toFixed(2)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePayslipPDF(data: PayslipPDFData): Promise<Buffer> {
  return renderToBuffer(<PayslipDocument data={data} />);
}
