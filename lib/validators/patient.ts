import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dob: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  phone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(15),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  bloodGroup: z.string().optional().nullable(),
  allergies: z.array(z.string()).default([]),
  govtIdNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  familyId: z.string().optional().nullable(),
  // when true, caller confirms they've reviewed duplicate warnings and want to proceed anyway
  forceCreate: z.boolean().default(false),
  // Optional initial vitals, recorded alongside registration if provided.
  vitalsBp: z.string().optional().nullable(),
  vitalsPulse: z.string().optional().nullable(),
  vitalsTemperature: z.string().optional().nullable(),
  vitalsBloodSugar: z.string().optional().nullable(),
  // Optional medical history, comma-separated condition names (e.g. "Diabetes, Hypertension").
  medicalHistory: z.string().optional().nullable(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  doctorId: z.string().min(1, "Select a doctor"),
  scheduledAt: z.string().min(1, "Select date & time"),
  reason: z.string().optional().nullable(),
  isFollowUp: z.boolean().default(false),
  recurrence: z
    .object({
      frequency: z.enum(["DAILY", "WEEKLY"]),
      count: z.number().min(2).max(60),
    })
    .optional()
    .nullable(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
