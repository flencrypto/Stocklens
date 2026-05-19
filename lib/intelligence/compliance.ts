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
  'not financial advice', // allowed as disclaimer, but we still flag for review in AI output
];

const TACTICAL_CONFLICT_TERMS = [
  'target coordinates',
  'how to attack',
  'weapon',
  'explosive',
  'kill',
  'assassinate',
  'sabotage',
  'evade sanctions',
];

function scanTerms(text: string, terms: string[]): string[] {
  const lowered = text.toLowerCase();
  return terms.filter((t) => lowered.includes(t));
}

export function runComplianceGuard(textBlob: string): ComplianceReport {
  const blockedTermsFound = scanTerms(textBlob, INVESTMENT_ADVICE_TERMS);
  const tacticalConflictRiskFound = scanTerms(textBlob, TACTICAL_CONFLICT_TERMS).length > 0;

  return {
    informationalOnly: blockedTermsFound.length === 0 && !tacticalConflictRiskFound,
    blockedTermsFound,
    tacticalConflictRiskFound,
  };
}

