import { ConsentFormType } from "@prisma/client";

/** Standard consent-form boilerplate text by type — starting point the staff can edit before capture. */
export const CONSENT_TEMPLATES: Record<ConsentFormType, string> = {
  SURGICAL_CONSENT:
    "I hereby consent to undergo the surgical procedure explained to me by the treating surgeon, including its risks, benefits, and alternatives. I understand that no guarantee has been made regarding the outcome.",
  ANESTHESIA_CONSENT:
    "I consent to the administration of anesthesia as deemed necessary by the anesthesiologist for my procedure, and understand the associated risks have been explained to me.",
  ADMISSION_CONSENT:
    "I consent to admission for evaluation and treatment at this hospital and authorize the hospital staff to provide medical care as deemed necessary.",
  PROCEDURE_CONSENT:
    "I consent to the diagnostic/therapeutic procedure explained to me, having understood its purpose, risks, and alternatives.",
  GENERAL_CONSENT:
    "I consent to routine medical examination, investigations, and treatment as advised by the treating physician.",
};
