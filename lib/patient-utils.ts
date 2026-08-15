import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Generates a branch-prefixed UHID like "PUN-2026-000123".
 * Sequential per branch per year, zero-padded to 6 digits.
 */
export async function generateUHID(branchId: string): Promise<string> {
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    select: { code: true },
  });

  const year = new Date().getFullYear();
  const prefix = `${branch.code}-${year}-`;

  const count = await prisma.patient.count({
    where: { branchId, uhid: { startsWith: prefix } },
  });

  const sequence = String(count + 1).padStart(6, "0");
  const candidate = `${prefix}${sequence}`;

  // Guard against rare race condition on concurrent registrations.
  const exists = await prisma.patient.findUnique({ where: { uhid: candidate } });
  if (exists) {
    const fallbackSeq = String(count + 1 + Math.floor(Math.random() * 100)).padStart(6, "0");
    return `${prefix}${fallbackSeq}`;
  }

  return candidate;
}

/** Classic Levenshtein edit-distance, used for fuzzy name matching (rule-based, no paid AI). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost
      );
    }
  }
  return dp[m]![n]!;
}

function nameSimilarity(a: string, b: string): number {
  const distance = levenshtein(a.toLowerCase().trim(), b.toLowerCase().trim());
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - distance / maxLen; // 1 = identical, 0 = completely different
}

export interface DuplicateCandidate {
  patientId: string;
  uhid: string;
  name: string;
  phone: string;
  score: number; // 0-1, higher = more likely duplicate
  matchedOn: string[];
}

/**
 * Rule-based duplicate-patient detection: fuzzy name match + exact phone
 * and/or DOB match. No ML/paid API — simple weighted heuristic.
 */
export async function findDuplicatePatients(input: {
  branchId: string;
  name: string;
  phone: string;
  dob?: Date | null;
}): Promise<DuplicateCandidate[]> {
  const sameBranchByPhone = await prisma.patient.findMany({
    where: { branchId: input.branchId, phone: input.phone },
    select: { id: true, uhid: true, name: true, phone: true, dob: true },
  });

  // Also pull a small pool by loose name match (first token) to catch
  // same-person-different-phone cases without scanning the whole table.
  const firstToken = input.name.trim().split(/\s+/)[0];
  const nameCandidates = firstToken
    ? await prisma.patient.findMany({
        where: {
          branchId: input.branchId,
          name: { contains: firstToken, mode: "insensitive" },
        },
        take: 25,
        select: { id: true, uhid: true, name: true, phone: true, dob: true },
      })
    : [];

  const pool = new Map(
    [...sameBranchByPhone, ...nameCandidates].map((p) => [p.id, p])
  );

  const candidates: DuplicateCandidate[] = [];

  for (const p of pool.values()) {
    const matchedOn: string[] = [];
    let score = 0;

    const sim = nameSimilarity(input.name, p.name);
    if (sim >= 0.75) {
      score += sim * 0.5;
      matchedOn.push("name");
    }

    if (p.phone === input.phone) {
      score += 0.4;
      matchedOn.push("phone");
    }

    if (input.dob && p.dob && p.dob.toDateString() === input.dob.toDateString()) {
      score += 0.2;
      matchedOn.push("dob");
    }

    if (score >= 0.5) {
      candidates.push({
        patientId: p.id,
        uhid: p.uhid,
        name: p.name,
        phone: p.phone,
        score: Math.min(score, 1),
        matchedOn,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}
