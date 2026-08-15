"use client";

import { useState } from "react";
import { createConsentForm } from "@/actions/consent";
import { CONSENT_TEMPLATES } from "@/lib/consent-templates";
import { SignaturePad } from "@/components/ipd/SignaturePad";
import type { ConsentFormType } from "@prisma/client";

const FORM_TYPES: ConsentFormType[] = [
  "ADMISSION_CONSENT",
  "SURGICAL_CONSENT",
  "ANESTHESIA_CONSENT",
  "PROCEDURE_CONSENT",
  "GENERAL_CONSENT",
];

export function ConsentFormBuilder({ patientId, admissionId }: { patientId: string; admissionId?: string }) {
  const [formType, setFormType] = useState<ConsentFormType>("ADMISSION_CONSENT");
  const [content, setContent] = useState(CONSENT_TEMPLATES.ADMISSION_CONSENT);
  const [signerName, setSignerName] = useState("");
  const [signerRelation, setSignerRelation] = useState("Self");
  const [witnessName, setWitnessName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);

  function handleTypeChange(type: ConsentFormType) {
    setFormType(type);
    setContent(CONSENT_TEMPLATES[type]);
  }

  async function handleSubmit() {
    if (!signatureDataUrl || !signerName) return;
    setSubmitting(true);

    const res = await createConsentForm({
      patientId,
      admissionId,
      formType,
      content,
      signerName,
      signerRelation,
      signatureDataUrl,
      witnessName: witnessName || undefined,
    });

    setSubmitting(false);
    if (res.ok) setSavedFormId(res.form.id);
  }

  if (savedFormId) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="mb-3 font-semibold text-brand-700">Consent recorded ✓</p>
        <a
          href={`/api/consent-forms/${savedFormId}/pdf`}
          target="_blank"
          className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          📄 View / Print Signed Consent
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:bg-neutral-900">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Consent Type</span>
        <select className="input" value={formType} onChange={(e) => handleTypeChange(e.target.value as ConsentFormType)}>
          {FORM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Consent Text (editable)</span>
        <textarea className="input" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Signer Name</span>
          <input className="input" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Full name" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Relation</span>
          <select className="input" value={signerRelation} onChange={(e) => setSignerRelation(e.target.value)}>
            <option>Self</option>
            <option>Guardian</option>
            <option>Spouse</option>
            <option>Parent</option>
            <option>Other</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Witness (optional)</span>
          <input className="input" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">Signature</span>
        <SignaturePad onCapture={setSignatureDataUrl} />
        {signatureDataUrl && <p className="mt-1 text-xs text-brand-600">Signature captured ✓</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !signatureDataUrl || !signerName}
        className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save Signed Consent"}
      </button>
    </div>
  );
}
