export interface ICD10Entry {
  code: string;
  label: string;
  category: string;
}

/**
 * A representative local subset of ICD-10 codes covering common OPD
 * presentations. In production this would be seeded from the full public
 * ICD-10-CM dataset (free, published by WHO/CDC) into the database — kept
 * as a static list here for the demo/dev environment.
 */
export const ICD10_DATASET: ICD10Entry[] = [
  { code: "J00", label: "Acute nasopharyngitis (common cold)", category: "Respiratory" },
  { code: "J02.9", label: "Acute pharyngitis, unspecified", category: "Respiratory" },
  { code: "J03.90", label: "Acute tonsillitis, unspecified", category: "Respiratory" },
  { code: "J06.9", label: "Acute upper respiratory infection, unspecified", category: "Respiratory" },
  { code: "J18.9", label: "Pneumonia, unspecified organism", category: "Respiratory" },
  { code: "J45.909", label: "Unspecified asthma, uncomplicated", category: "Respiratory" },
  { code: "K21.9", label: "Gastro-esophageal reflux disease without esophagitis", category: "Gastrointestinal" },
  { code: "K29.70", label: "Gastritis, unspecified, without bleeding", category: "Gastrointestinal" },
  { code: "K59.00", label: "Constipation, unspecified", category: "Gastrointestinal" },
  { code: "A09", label: "Infectious gastroenteritis and colitis, unspecified", category: "Gastrointestinal" },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications", category: "Endocrine" },
  { code: "E78.5", label: "Hyperlipidemia, unspecified", category: "Endocrine" },
  { code: "E03.9", label: "Hypothyroidism, unspecified", category: "Endocrine" },
  { code: "I10", label: "Essential (primary) hypertension", category: "Cardiovascular" },
  { code: "I25.10", label: "Atherosclerotic heart disease of native coronary artery", category: "Cardiovascular" },
  { code: "R51", label: "Headache", category: "Neurological" },
  { code: "G43.909", label: "Migraine, unspecified, not intractable", category: "Neurological" },
  { code: "M54.5", label: "Low back pain", category: "Musculoskeletal" },
  { code: "M25.50", label: "Pain in unspecified joint", category: "Musculoskeletal" },
  { code: "M79.1", label: "Myalgia", category: "Musculoskeletal" },
  { code: "N39.0", label: "Urinary tract infection, site not specified", category: "Genitourinary" },
  { code: "L23.9", label: "Allergic contact dermatitis, unspecified cause", category: "Dermatological" },
  { code: "L30.9", label: "Dermatitis, unspecified", category: "Dermatological" },
  { code: "R50.9", label: "Fever, unspecified", category: "General" },
  { code: "R05", label: "Cough", category: "Respiratory" },
  { code: "R10.4", label: "Other and unspecified abdominal pain", category: "Gastrointestinal" },
  { code: "F41.9", label: "Anxiety disorder, unspecified", category: "Psychiatric" },
  { code: "F32.9", label: "Major depressive disorder, single episode, unspecified", category: "Psychiatric" },
  { code: "H52.4", label: "Presbyopia", category: "Ophthalmological" },
  { code: "H66.90", label: "Otitis media, unspecified, unspecified ear", category: "ENT" },
];

export function searchICD10(query: string, limit = 15): ICD10Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICD10_DATASET.slice(0, limit);

  return ICD10_DATASET.filter(
    (entry) =>
      entry.code.toLowerCase().includes(q) ||
      entry.label.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q)
  ).slice(0, limit);
}
