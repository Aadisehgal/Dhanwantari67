import { PrismaClient, RoleName, ModuleName, ActionName } from "@prisma/client";
import bcrypt from "bcryptjs";

const ALL_MODULES = Object.values(ModuleName);
const ALL_ACTIONS = Object.values(ActionName);

const ROLE_MODULE_MAP: Partial<Record<RoleName, ModuleName[]>> = {
  HOSPITAL_ADMIN: ALL_MODULES,
  BRANCH_ADMIN: ALL_MODULES.filter((m) => m !== "SETTINGS"),
  RECEPTIONIST: ["DASHBOARD", "PATIENTS", "APPOINTMENTS", "QUEUE", "BILLING", "HR"],
  DOCTOR: ["DASHBOARD", "PATIENTS", "APPOINTMENTS", "OPD", "EMR", "IPD", "OT", "LAB", "HR"],
  NURSE: ["DASHBOARD", "PATIENTS", "IPD", "EMR", "HR"],
  PHARMACIST: ["DASHBOARD", "PHARMACY", "BILLING", "HR"],
  LAB_TECHNICIAN: ["DASHBOARD", "LAB", "HR"],
  ACCOUNTANT: ["DASHBOARD", "BILLING", "REPORTS", "HR"],
  STORE_MANAGER: ["DASHBOARD", "PHARMACY", "REPORTS", "HR"],
  HR_MANAGER: ["DASHBOARD", "HR"],
  PATIENT: ["APPOINTMENTS", "EMR", "BILLING"],
};

export async function runSeed(prisma: PrismaClient): Promise<string[]> {
  const log: string[] = [];
  const push = (msg: string) => {
    log.push(msg);
    console.log(msg);
  };

  push("Seeding Dhanwantari Healthcare demo data...");

  const hospital = await prisma.hospital.upsert({
    where: { id: "demo-hospital" },
    update: {},
    create: {
      id: "demo-hospital",
      name: "Dhanwantari General Hospital",
      gstNo: "27AAAAA0000A1Z5",
      address: "MG Road, Pune, Maharashtra",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { hospitalId_code: { hospitalId: hospital.id, code: "PUN" } },
    update: {},
    create: {
      hospitalId: hospital.id,
      name: "Pune Main Branch",
      code: "PUN",
      address: "MG Road, Pune",
      phone: "+91-9999999999",
    },
  });

  const permissionRecords = [];
  for (const module of ALL_MODULES) {
    for (const action of ALL_ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action },
      });
      permissionRecords.push(perm);
    }
  }

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, label: roleName.replace(/_/g, " "), isCustom: false },
    });

    const allowedModules = ROLE_MODULE_MAP[roleName] ?? [];
    for (const perm of permissionRecords) {
      if (allowedModules.includes(perm.module)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  const passwordHash = await bcrypt.hash("Demo@1234", 10);
  const demoUsers: { email: string; name: string; role: RoleName }[] = [
    { email: "admin@dhanwantari.demo", name: "Hospital Admin", role: "HOSPITAL_ADMIN" },
    { email: "reception@dhanwantari.demo", name: "Reception Desk", role: "RECEPTIONIST" },
    { email: "doctor@dhanwantari.demo", name: "Dr. Asha Verma", role: "DOCTOR" },
    { email: "pharmacist@dhanwantari.demo", name: "Pharmacy Desk", role: "PHARMACIST" },
    { email: "accountant@dhanwantari.demo", name: "Accounts Desk", role: "ACCOUNTANT" },
    { email: "hr@dhanwantari.demo", name: "HR Manager", role: "HR_MANAGER" },
  ];

  for (const u of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: u.role } });
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        roleId: role.id,
        branchId: branch.id,
      },
    });

    if (u.role === "DOCTOR") {
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          specialization: "General Medicine",
          qualification: "MBBS, MD",
        },
      });
    }

    const existingStaff = await prisma.staff.findUnique({ where: { userId: user.id } });
    if (!existingStaff) {
      const empIndex = demoUsers.indexOf(u) + 1;
      await prisma.staff.create({
        data: {
          userId: user.id,
          employeeId: `EMP-${String(empIndex).padStart(4, "0")}`,
          department: u.role === "DOCTOR" ? "Medical" : u.role === "PHARMACIST" ? "Pharmacy" : u.role === "ACCOUNTANT" ? "Finance" : "Administration",
          designation: u.role.replace(/_/g, " "),
          basicSalary: u.role === "DOCTOR" ? 80000 : u.role === "HOSPITAL_ADMIN" ? 60000 : 30000,
          bankAccountNo: `XXXX${1000 + empIndex}`,
        },
      });
    }
  }

  const wardConfigs = [
    { name: "General Ward", type: "General", bedCount: 6, dailyRate: 1500 },
    { name: "ICU", type: "Intensive Care", bedCount: 4, dailyRate: 5000 },
    { name: "Private Rooms", type: "Private", bedCount: 4, dailyRate: 3500 },
  ];

  for (const wc of wardConfigs) {
    const existing = await prisma.ward.findFirst({ where: { branchId: branch.id, name: wc.name } });
    const ward = existing ?? (await prisma.ward.create({ data: { branchId: branch.id, name: wc.name, type: wc.type } }));

    const existingBeds = await prisma.bed.count({ where: { wardId: ward.id } });
    if (existingBeds === 0) {
      for (let i = 1; i <= wc.bedCount; i++) {
        await prisma.bed.create({
          data: { wardId: ward.id, label: `${wc.name.slice(0, 1)}${i}`, dailyRate: wc.dailyRate },
        });
      }
    }
  }

  const interactions = [
    { drugA: "Warfarin", drugB: "Aspirin", severity: "Major", note: "Increased bleeding risk" },
    { drugA: "Warfarin", drugB: "Ibuprofen", severity: "Major", note: "Increased bleeding risk" },
    { drugA: "Azithromycin", drugB: "Warfarin", severity: "Moderate", note: "May potentiate anticoagulant effect" },
    { drugA: "Losartan", drugB: "Amlodipine", severity: "Minor", note: "Monitor blood pressure, generally safe combination" },
    { drugA: "Ciprofloxacin", drugB: "Insulin Glargine", severity: "Moderate", note: "May alter blood glucose control" },
  ];
  for (const i of interactions) {
    await prisma.drugInteraction.upsert({
      where: { drugA_drugB: { drugA: i.drugA, drugB: i.drugB } },
      update: {},
      create: i,
    });
  }

  const labTests = [
    { name: "Complete Blood Count (CBC)", category: "Hematology", price: 400, normalRange: "4.5-11.0", unit: "x10^9/L", sampleType: "Blood (EDTA)", tatHours: 4 },
    { name: "Fasting Blood Sugar", category: "Biochemistry", price: 150, normalRange: "70-110", unit: "mg/dL", sampleType: "Blood (Fluoride)", tatHours: 2 },
    { name: "Lipid Profile", category: "Biochemistry", price: 600, normalRange: "0-200", unit: "mg/dL", sampleType: "Blood (Serum)", tatHours: 6 },
    { name: "Liver Function Test (LFT)", category: "Biochemistry", price: 700, normalRange: "0-40", unit: "U/L", sampleType: "Blood (Serum)", tatHours: 6 },
    { name: "Kidney Function Test (KFT)", category: "Biochemistry", price: 700, normalRange: "0.6-1.2", unit: "mg/dL", sampleType: "Blood (Serum)", tatHours: 6 },
    { name: "Thyroid Profile (TSH)", category: "Endocrinology", price: 500, normalRange: "0.4-4.0", unit: "mIU/L", sampleType: "Blood (Serum)", tatHours: 24 },
    { name: "Urine Routine & Microscopy", category: "Pathology", price: 200, normalRange: undefined, unit: undefined, sampleType: "Urine", tatHours: 3 },
    { name: "HbA1c", category: "Biochemistry", price: 450, normalRange: "4.0-5.6", unit: "%", sampleType: "Blood (EDTA)", tatHours: 24 },
  ];
  for (const t of labTests) {
    const existing = await prisma.labTest.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.labTest.create({ data: t as any });
    }
  }

  push("Seed complete. Demo login accounts (password: Demo@1234):");
  demoUsers.forEach((u) => push(`  - ${u.role}: ${u.email}`));

  return log;
}
