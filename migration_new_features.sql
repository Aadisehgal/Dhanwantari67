-- Run this once in Neon's SQL Editor before deploying the new patient
-- registration features (vitals + medical history + report uploads).

ALTER TABLE "vitals" ADD COLUMN "bloodSugar" DOUBLE PRECISION;

CREATE TABLE "patient_documents" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT,
  "category" TEXT,
  "uploadedBy" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);
CREATE INDEX "patient_documents_patientId_uploadedAt_idx" ON "patient_documents"("patientId","uploadedAt");
ALTER TABLE "patient_documents" ADD FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE;
