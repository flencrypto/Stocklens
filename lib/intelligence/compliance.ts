import { ComplianceReport } from '@/lib/intelligence/types';

const INVESTMENT_ADVICE_TERMS = [
  'buy now',
  'sell now',
  'strong buy',
  'strong sell',
  'guaranteed',
  'sure thing',
  'cannot lose',
  'this will moon',
  'you should buy',
  'you should sell',
  'must buy',
  'must sell',
  'financial advice',
  // 'not financial advice' is a compliance disclaimer — do NOT flag it
];

// Terms matched with word-boundary regex to avoid false positives (e.g. "skill" ≠ "kill").
const TACTICAL_CONFLICT_PATTERNS: RegExp[] = [
  /target coordinates/i,
  /how to attack/i,
  /\bweapons?\b/i,
  /\bexplosive\b/i,
  /\bkill\b/i,
  /\bassassinate\b/i,
  /\bsabotage\b/i,
  /evade sanctions/i,
];

function scanTerms(text: string, terms: string[]): string[] {
  const lowered = text.toLowerCase();
  return terms.filter((t) => lowered.includes(t));
}

function scanTacticalConflict(text: string): boolean {
  return TACTICAL_CONFLICT_PATTERNS.some((re) => re.test(text));
}

export function runComplianceGuard(textBlob: string): ComplianceReport {
  const blockedTermsFound = scanTerms(textBlob, INVESTMENT_ADVICE_TERMS);
  const tacticalConflictRiskFound = scanTacticalConflict(textBlob);

  return {
    informationalOnly: blockedTermsFound.length === 0 && !tacticalConflictRiskFound,
    blockedTermsFound,
    tacticalConflictRiskFound,
  };
}

