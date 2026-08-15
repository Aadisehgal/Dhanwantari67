export interface MedicineEntry {
  name: string;
  generic: string;
  category: string;
  commonDosages: string[];
}

/**
 * Local medicine master used for prescription drug-search autocomplete.
 * Production deployments would populate this from the Medicine/MedicineBatch
 * tables (Section 4.11) once pharmacy inventory is loaded; kept static here
 * for the OPD prescription-builder demo.
 */
export const MEDICINE_DATASET: MedicineEntry[] = [
  { name: "Paracetamol", generic: "Acetaminophen", category: "Analgesic/Antipyretic", commonDosages: ["500mg", "650mg"] },
  { name: "Ibuprofen", generic: "Ibuprofen", category: "NSAID", commonDosages: ["200mg", "400mg"] },
  { name: "Aspirin", generic: "Acetylsalicylic acid", category: "NSAID/Antiplatelet", commonDosages: ["75mg", "325mg"] },
  { name: "Amoxicillin", generic: "Amoxicillin", category: "Antibiotic (Penicillin)", commonDosages: ["250mg", "500mg"] },
  { name: "Azithromycin", generic: "Azithromycin", category: "Antibiotic (Macrolide)", commonDosages: ["250mg", "500mg"] },
  { name: "Cetirizine", generic: "Cetirizine", category: "Antihistamine", commonDosages: ["10mg"] },
  { name: "Omeprazole", generic: "Omeprazole", category: "PPI", commonDosages: ["20mg", "40mg"] },
  { name: "Metformin", generic: "Metformin", category: "Antidiabetic", commonDosages: ["500mg", "1000mg"] },
  { name: "Amlodipine", generic: "Amlodipine", category: "Antihypertensive (CCB)", commonDosages: ["5mg", "10mg"] },
  { name: "Atorvastatin", generic: "Atorvastatin", category: "Statin", commonDosages: ["10mg", "20mg", "40mg"] },
  { name: "Warfarin", generic: "Warfarin", category: "Anticoagulant", commonDosages: ["1mg", "5mg"] },
  { name: "Losartan", generic: "Losartan", category: "Antihypertensive (ARB)", commonDosages: ["50mg", "100mg"] },
  { name: "Salbutamol Inhaler", generic: "Salbutamol", category: "Bronchodilator", commonDosages: ["100mcg/puff"] },
  { name: "Levothyroxine", generic: "Levothyroxine", category: "Thyroid hormone", commonDosages: ["25mcg", "50mcg", "100mcg"] },
  { name: "Diclofenac", generic: "Diclofenac", category: "NSAID", commonDosages: ["50mg"] },
  { name: "Ciprofloxacin", generic: "Ciprofloxacin", category: "Antibiotic (Fluoroquinolone)", commonDosages: ["250mg", "500mg"] },
  { name: "Ranitidine", generic: "Ranitidine", category: "H2 blocker", commonDosages: ["150mg"] },
  { name: "Sertraline", generic: "Sertraline", category: "SSRI", commonDosages: ["25mg", "50mg"] },
  { name: "Insulin Glargine", generic: "Insulin glargine", category: "Insulin", commonDosages: ["Units as advised"] },
  { name: "Penicillin V", generic: "Phenoxymethylpenicillin", category: "Antibiotic (Penicillin)", commonDosages: ["250mg", "500mg"] },
];

export function searchMedicines(query: string, limit = 10): MedicineEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return MEDICINE_DATASET.slice(0, limit);
  return MEDICINE_DATASET.filter(
    (m) => m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q)
  ).slice(0, limit);
}

/**
 * Rule-based allergy check: flags a drug if its name/generic overlaps with
 * any string in the patient's recorded allergy list (case-insensitive
 * substring match — deliberately simple/transparent, no ML involved).
 */
export function checkAllergyConflict(drugName: string, patientAllergies: string[]): string | null {
  const drugLower = drugName.toLowerCase();
  const medEntry = MEDICINE_DATASET.find(
    (m) => m.name.toLowerCase() === drugLower || m.generic.toLowerCase() === drugLower
  );

  for (const allergy of patientAllergies) {
    const a = allergy.trim().toLowerCase();
    if (!a) continue;
    if (drugLower.includes(a) || a.includes(drugLower)) {
      return `Patient has a recorded allergy to "${allergy}"`;
    }
    if (medEntry && (medEntry.generic.toLowerCase().includes(a) || a.includes(medEntry.category.toLowerCase()))) {
      return `Patient has a recorded allergy related to "${allergy}" (drug category: ${medEntry.category})`;
    }
  }
  return null;
}
