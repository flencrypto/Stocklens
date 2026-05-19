import { AssetInsights } from '@/lib/insights';

export type SourceKind =
  | 'regulator_filing'
  | 'company_ir'
  | 'transcript'
  | 'exchange_notice'
  | 'data_provider'
  | 'news'
  | 'computed'
  | 'internal_reference'
  | 'user_provided';

export interface Source {
  id: string;
  kind: SourceKind;
  title: string;
  url?: string;
  publishedAt?: string;
  retrievedAt: string;
  authorityScore: number; // 0..1
  notes?: string;
}

export type ClaimClassification = 'fact' | 'calculation' | 'assumption' | 'hypothesis';

export interface Claim {
  id: string;
  classification: ClaimClassification;
  material: boolean;
  text: string;
  citations: string[]; // Source.id
}

export interface KeyNumber {
  label: string;
  value: string;
  citations: string[];
}

export interface WedgeBrief10Min {
  whatChanged: string[];
  whyItMatters: string[];
  marketReaction: string;
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  catalysts: string[];
  keyNumbers: KeyNumber[];
  valuationSnapshot: string[];
  technicalSetup: string[];
  insiderAndShortInterest: string[];
  exchangeAndMarketStructure: string[];
  falsificationChecks: string[];
}

export interface ComplianceReport {
  informationalOnly: boolean;
  blockedTermsFound: string[];
  tacticalConflictRiskFound: boolean;
}

export interface TrustEngineReport {
  citationCoveragePct: number; // 0..100 for material claims
  unsupportedMaterialClaims: Claim[];
  unknownCitationIds: string[];
}

export interface IntelligenceResult {
  version: 1;
  retrievedAt: string;
  sources: Source[];
  claims: Claim[];
  brief: WedgeBrief10Min;
  insights: AssetInsights; // compatibility bridge for existing UI
  compliance: ComplianceReport;
  trust: TrustEngineReport;
}

