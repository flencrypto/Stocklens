import { Claim, Source, TrustEngineReport } from '@/lib/intelligence/types';

export function auditCitations(params: {
  sources: Source[];
  claims: Claim[];
}): TrustEngineReport {
  const sourceIds = new Set(params.sources.map((s) => s.id));

  const materialClaims = params.claims.filter((c) => c.material);
  const unsupportedMaterialClaims = materialClaims.filter((c) => c.citations.length === 0);

  const unknownCitationIds: string[] = [];
  for (const claim of params.claims) {
    for (const cite of claim.citations) {
      if (!sourceIds.has(cite) && !unknownCitationIds.includes(cite)) unknownCitationIds.push(cite);
    }
  }

  const total = materialClaims.length;
  const supported = materialClaims.filter((c) => c.citations.length > 0).length;
  const citationCoveragePct = total === 0 ? 100 : Math.round((supported / total) * 100);

  return { citationCoveragePct, unsupportedMaterialClaims, unknownCitationIds };
}

