"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordVitals, createEMREntry, addDiagnosis, createPrescription, type PrescriptionWarning } from "@/actions/opd";
import { searchICD10, type ICD10Entry } from "@/lib/medical-data/icd10";
import { searchMedicines, type MedicineEntry } from "@/lib/medical-data/medicines";
import { useVoiceDictation } from "@/lib/hooks/useVoiceDictation";
import { submitWithOfflineFallback } from "@/lib/offline/queue";

interface RxItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export function OPDConsultation({
  patientId,
  doctorId,
}: {
  patientId: string;
  doctorId: string;
}) {
  // Vitals
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // Diagnosis
  const [diagQuery, setDiagQuery] = useState("");
  const [diagResults, setDiagResults] = useState<ICD10Entry[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<ICD10Entry[]>([]);

  // Prescription
  const [drugQuery, setDrugQuery] = useState("");
  const [drugResults, setDrugResults] = useState<MedicineEntry[]>([]);
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [notes, setNotes] = useState("");

  const [warnings, setWarnings] = useState<PrescriptionWarning[]>([]);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dictation = useVoiceDictation((text) => setNotes((n) => (n ? `${n} ${text}` : text)));

  async function handleSaveVitals() {
    const payload = {
      patientId,
      bp: bp || undefined,
      pulse: pulse ? Number(pulse) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
    };
    await submitWithOfflineFallback("recordVitals", payload, () => recordVitals(payload));
    setVitalsSaved(true);
  }

  function handleDiagSearch(q: string) {
    setDiagQuery(q);
    setDiagResults(q ? searchICD10(q) : []);
  }

  function addDiagnosisRow(d: ICD10Entry) {
    if (!selectedDiagnoses.find((x) => x.code === d.code)) {
      setSelectedDiagnoses((prev) => [...prev, d]);
    }
    setDiagQuery("");
    setDiagResults([]);
  }

  function handleDrugSearch(q: string) {
    setDrugQuery(q);
    setDrugResults(q ? searchMedicines(q) : []);
  }

  function addRxRow(m: MedicineEntry) {
    setRxItems((prev) => [
      ...prev,
      { medicineName: m.name, dosage: m.commonDosages[0] ?? "", frequency: "1-0-1", durationDays: 5, instructions: "After food" },
    ]);
    setDrugQuery("");
    setDrugResults([]);
  }

  function updateRxRow(idx: number, field: keyof RxItem, value: string | number) {
    setRxItems((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function removeRxRow(idx: number) {
    setRxItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleFinalize() {
    if (rxItems.length === 0) return;
    setSubmitting(true);

    const emrRes = await createEMREntry(patientId, "OPD", notes || undefined);
    const emrId = emrRes.emr.id;

    for (const d of selectedDiagnoses) {
      await addDiagnosis(emrId, d.code, d.label);
    }

    const rxRes = await createPrescription(
      emrId,
      doctorId,
      patientId,
      rxItems.map((r) => ({
        medicineName: r.medicineName,
        dosage: r.dosage,
        frequency: r.frequency,
        durationDays: r.durationDays,
        instructions: r.instructions,
      }))
    );

    setSubmitting(false);

    if (rxRes.ok) {
      setWarnings(rxRes.warnings);
      setPrescriptionId(rxRes.prescription.id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Vitals */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <h2 className="mb-3 font-semibold">Vitals</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="input" placeholder="BP (e.g. 120/80)" value={bp} onChange={(e) => setBp(e.target.value)} />
          <input className="input" placeholder="Pulse (bpm)" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          <input className="input" placeholder="Temp (°F)" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          <input className="input" placeholder="SpO2 (%)" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
          <input className="input" placeholder="Weight (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <input className="input" placeholder="Height (cm)" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </div>
        <button
          onClick={handleSaveVitals}
          className="mt-3 rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {vitalsSaved ? "Vitals Saved ✓" : "Save Vitals"}
        </button>
      </section>

      {/* Diagnosis */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <h2 className="mb-3 font-semibold">Diagnosis (ICD-10)</h2>
        <div className="relative">
          <input
            className="input"
            placeholder="Search ICD-10 code or condition..."
            value={diagQuery}
            onChange={(e) => handleDiagSearch(e.target.value)}
          />
          {diagResults.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:bg-neutral-900">
              {diagResults.map((d) => (
                <li
                  key={d.code}
                  onClick={() => addDiagnosisRow(d)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-brand-50"
                >
                  <span className="font-mono text-xs text-neutral-400">{d.code}</span> — {d.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedDiagnoses.map((d) => (
            <span key={d.code} className="rounded-full bg-accent-50 px-3 py-1 text-xs text-accent-600">
              {d.code} — {d.label}
            </span>
          ))}
        </div>
      </section>

      {/* Prescription */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
        <h2 className="mb-3 font-semibold">Digital Prescription</h2>
        <div className="relative">
          <input
            className="input"
            placeholder="Search medicine..."
            value={drugQuery}
            onChange={(e) => handleDrugSearch(e.target.value)}
          />
          {drugResults.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:bg-neutral-900">
              {drugResults.map((m) => (
                <li
                  key={m.name}
                  onClick={() => addRxRow(m)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-brand-50"
                >
                  {m.name} <span className="text-xs text-neutral-400">({m.generic})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {rxItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-neutral-100 p-2 text-sm dark:border-neutral-800">
              <span className="col-span-3 font-medium">{item.medicineName}</span>
              <input className="input col-span-2" value={item.dosage} onChange={(e) => updateRxRow(idx, "dosage", e.target.value)} />
              <input className="input col-span-2" value={item.frequency} onChange={(e) => updateRxRow(idx, "frequency", e.target.value)} />
              <input
                type="number"
                className="input col-span-2"
                value={item.durationDays}
                onChange={(e) => updateRxRow(idx, "durationDays", Number(e.target.value))}
              />
              <input className="input col-span-2" value={item.instructions} onChange={(e) => updateRxRow(idx, "instructions", e.target.value)} />
              <button onClick={() => removeRxRow(idx)} className="col-span-1 text-status-alert">✕</button>
            </div>
          ))}
          {rxItems.length === 0 && <p className="text-sm text-neutral-400">No medicines added yet.</p>}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Clinical Notes</span>
            {dictation.isSupported && (
              <button
                type="button"
                onClick={dictation.isListening ? dictation.stop : dictation.start}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  dictation.isListening ? "bg-status-alert text-white" : "bg-accent-50 text-accent-600"
                }`}
              >
                {dictation.isListening ? "● Listening..." : "🎤 Dictate"}
              </button>
            )}
          </div>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${w.type === "ALLERGY" ? "bg-red-50 text-status-alert" : "bg-amber-50 text-amber-800"}`}
              >
                <strong>{w.type === "ALLERGY" ? "⚠ Allergy warning: " : "⚠ Drug interaction: "}</strong>
                {w.message} ({w.drugs.join(" + ")})
              </div>
            ))}
          </div>
        )}

        {prescriptionId ? (
          <a
            href={`/api/prescriptions/${prescriptionId}/pdf`}
            target="_blank"
            className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            📄 Print / Download Prescription PDF
          </a>
        ) : (
          <button
            onClick={handleFinalize}
            disabled={submitting || rxItems.length === 0}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Finalize Prescription"}
          </button>
        )}
      </section>
    </div>
  );
}
