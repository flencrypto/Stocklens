import { CryptoData } from '@/lib/cryptoData';
import { describeExchangeContext } from '@/lib/exchanges';
import { AssetInsights } from '@/lib/insights';
import { StockData } from '@/lib/stockData';
import { runComplianceGuard } from '@/lib/intelligence/compliance';
import { buildDefaultSourcePack } from '@/lib/intelligence/sourcePack';
import { auditCitations } from '@/lib/intelligence/trustEngine';
import { Claim, IntelligenceResult, Source, WedgeBrief10Min } from '@/lib/intelligence/types';

type Provider = 'openai' | 'xai';

const PROVIDERS: Record<Provider, { url: string; defaultModel: string }> = {
  openai: { url: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o-mini' },
  xai: { url: 'https://api.x.ai/v1/chat/completions', defaultModel: 'grok-2-mini' },
};

interface OpenAIChoice {
  message?: { content?: string };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?: { message?: string };
}

function nowIso() {
  return new Date().toISOString();
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

function buildSnapshot(
  type: 'stock' | 'crypto',
  data: StockData | CryptoData,
  assetClass: string,
): Record<string, unknown> {
  const base: Record<string, unknown> = { assetType: type, assetClass };
  const entries = Object.entries(data as unknown as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.length > 600) {
      base[key] = value.slice(0, 600) + '…';
    } else {
      base[key] = value;
    }
  }
  return base;
}

function findMissingDataKeys(type: 'stock' | 'crypto', data: StockData | CryptoData): string[] {
  const important = type === 'stock'
    ? [
        'ticker',
        'exchange',
        'marketCap',
        'price',
        'priceChangePercentage30d',
        'revenue',
        'revenueGrowth',
        'grossMargin',
        'operatingMargin',
        'profitMargin',
        'peRatio',
        'forwardPE',
        'beta',
        'totalDebt',
        'cash',
        'lastEarningsDate',
      ]
    : [
        'id',
        'symbol',
        'marketCap',
        'marketCapRank',
        'currentPrice',
        'priceChangePercentage30d',
        'circulatingSupply',
        'totalSupply',
        'maxSupply',
        'fdv',
        'categories',
        'chain',
      ];

  const record = data as unknown as Record<string, unknown>;
  return important.filter((key) => record[key] === null || record[key] === undefined || record[key] === '');
}

function coerceStringArray(v: unknown, max = 5): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function pickString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function validateBriefShape(brief: Record<string, unknown>): WedgeBrief10Min {
  const thesis = pickString(brief.thesis);
  const bullCase = coerceStringArray(brief.bullCase, 5);
  const bearCase = coerceStringArray(brief.bearCase, 5);
  const catalysts = coerceStringArray(brief.catalysts, 5);

  if (!thesis || bullCase.length !== 5 || bearCase.length !== 5 || catalysts.length !== 5) {
    throw new Error('Intelligence brief missing required thesis/bull/bear/catalysts shape');
  }

  const normalize = (v: unknown, max = 6) => coerceStringArray(v, max);
  const marketReaction = pickString(brief.marketReaction);

  const keyNumbers = Array.isArray(brief.keyNumbers)
    ? brief.keyNumbers
        .map((k) => {
          if (!k || typeof k !== 'object') return null;
          const obj = k as Record<string, unknown>;
          const label = pickString(obj.label);
          const value = pickString(obj.value);
          const citations = coerceStringArray(obj.citations, 8);
          if (!label || !value) return null;
          return { label, value, citations };
        })
        .filter((v): v is { label: string; value: string; citations: string[] } => v !== null)
        .slice(0, 10)
    : [];

  return {
    whatChanged: normalize(brief.whatChanged, 6),
    whyItMatters: normalize(brief.whyItMatters, 6),
    marketReaction: marketReaction || 'Market reaction could not be determined from the provided snapshot.',
    thesis,
    bullCase,
    bearCase,
    catalysts,
    keyNumbers,
    valuationSnapshot: normalize(brief.valuationSnapshot, 6),
    technicalSetup: normalize(brief.technicalSetup, 6),
    insiderAndShortInterest: normalize(brief.insiderAndShortInterest, 6),
    exchangeAndMarketStructure: normalize(brief.exchangeAndMarketStructure, 6),
    falsificationChecks: normalize(brief.falsificationChecks, 6),
  };
}

function validateClaims(v: unknown): Claim[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item, idx) => {
      const obj = item as Record<string, unknown>;
      const id = pickString(obj.id) || `C${idx + 1}`;
      const classification = pickString(obj.classification) as Claim['classification'];
      const material = Boolean(obj.material);
      const text = pickString(obj.text);
      const citations = coerceStringArray(obj.citations, 16);
      if (!text) return null;
      if (!['fact', 'calculation', 'assumption', 'hypothesis'].includes(classification)) return null;
      return { id, classification, material, text, citations } satisfies Claim;
    })
    .filter(Boolean) as Claim[];
}

function systemPrompt(exchangeContext: string) {
  return (
    'You are Stocklens Orchestrator: an equity/crypto intelligence system that must be auditable.\n' +
    'Hard rules:\n' +
    '- No fabricated numbers.\n' +
    '- No unsupported material claims.\n' +
    '- No buy/sell commands or personalised financial advice.\n' +
    '- No market manipulation strategies.\n' +
    '- Conflict/war content: public geopolitical and market-risk analysis only; no tactical guidance.\n' +
    'Citations:\n' +
    '- You may ONLY cite from the provided Allowed Sources.\n' +
    '- Every material claim must include at least 1 citation.\n' +
    (exchangeContext
      ? '\nMarket-structure context is provided; use it to comment on listing venue, liquidity expectations, and institutional access.\n'
      : '')
  );
}

function userPrompt(params: {
  snapshot: Record<string, unknown>;
  allowedSources: Source[];
  missingData: string[];
  exchangeContext: string;
}) {
  return [
    'Generate a "10-minute institutional investor brief" using ONLY the provided snapshot.',
    'Return strict JSON only (no markdown).',
    '',
    'Allowed Sources (you may only cite these IDs):',
    JSON.stringify(
      params.allowedSources.map((s) => compactObject({
        id: s.id,
        kind: s.kind,
        title: s.title,
        url: s.url,
        publishedAt: s.publishedAt,
        retrievedAt: s.retrievedAt,
        authorityScore: s.authorityScore,
      })),
    ),
    '',
    'Missing-data keys (do not guess these):',
    JSON.stringify(params.missingData),
    '',
    'Asset snapshot:',
    JSON.stringify(params.snapshot),
    ...(params.exchangeContext ? ['', 'Exchange / market context:', params.exchangeContext] : []),
    '',
    'Output JSON schema (exact keys):',
    '{',
    '  "version": 1,',
    '  "sourcesUsed": string[],',
    '  "claims": [',
    '    { "id": "C1", "classification": "fact|calculation|assumption|hypothesis", "material": boolean, "text": string, "citations": string[] }',
    '  ],',
    '  "brief": {',
    '    "whatChanged": string[],',
    '    "whyItMatters": string[],',
    '    "marketReaction": string,',
    '    "thesis": string,',
    '    "bullCase": string[],',
    '    "bearCase": string[],',
    '    "catalysts": string[],',
    '    "keyNumbers": [ { "label": string, "value": string, "citations": string[] } ],',
    '    "valuationSnapshot": string[],',
    '    "technicalSetup": string[],',
    '    "insiderAndShortInterest": string[],',
    '    "exchangeAndMarketStructure": string[],',
    '    "falsificationChecks": string[]',
    '  }',
    '}',
    '',
    'Constraints:',
    '- bullCase/bearCase/catalysts must each have EXACTLY 5 items.',
    '- keyNumbers values must be strings; if uncertain, omit the keyNumber.',
    '- If market reaction cannot be inferred from snapshot, say so explicitly.',
    '- Use short, dense sentences; avoid hype.',
  ].join('\n');
}

async function callOpenAI(params: {
  apiKey: string;
  model: string;
  url: string;
  system: string;
  user: string;
  signal?: AbortSignal;
  temperature: number;
}): Promise<string> {
  const res = await fetch(params.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      temperature: params.temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    }),
    signal: params.signal,
  });

  const json = (await res.json()) as OpenAIResponse;
  if (!res.ok) {
    const msg = json?.error?.message || `OpenAI request failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI response did not contain any content');
  return content;
}

function stringifyForCompliance(result: { brief: WedgeBrief10Min; claims: Claim[]; sources: Source[] }) {
  return JSON.stringify({
    brief: result.brief,
    claims: result.claims,
    sources: result.sources.map((s) => ({ id: s.id, title: s.title, kind: s.kind, url: s.url })),
  });
}

export async function generateIntelligence(params: {
  apiKey: string;
  provider?: Provider;
  type: 'stock' | 'crypto';
  data: StockData | CryptoData;
  assetClass: string;
  options?: { model?: string; signal?: AbortSignal; baseUrl?: string };
}): Promise<IntelligenceResult> {
  if (!params.apiKey || !params.apiKey.trim()) {
    throw new Error('OpenAI API key is required');
  }

  const provider: Provider = params.provider || 'openai';
  const providerCfg = PROVIDERS[provider];
  const url = params.options?.baseUrl || providerCfg.url;

  const retrievedAt = nowIso();
  const snapshot = buildSnapshot(params.type, params.data, params.assetClass);
  const missingData = findMissingDataKeys(params.type, params.data);

  let exchangeContext = '';
  if (params.type === 'stock') {
    const stockData = params.data as StockData;
    exchangeContext = describeExchangeContext(stockData.exchange || '', stockData.marketCap, {
      ticker: stockData.ticker,
    });
  }

  const sources = buildDefaultSourcePack({ type: params.type, data: params.data, exchangeContext });
  const model = params.options?.model || providerCfg.defaultModel;

  const system = systemPrompt(exchangeContext);
  const user = userPrompt({ snapshot, allowedSources: sources, missingData, exchangeContext });

  const attempt = async (temperature: number) => {
    const content = await callOpenAI({
      apiKey: params.apiKey,
      model,
      url,
      system,
      user,
      signal: params.options?.signal,
      temperature,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    const claims = validateClaims(parsed.claims);
    const brief = validateBriefShape((parsed.brief as Record<string, unknown>) || {});

    if (claims.length < 6 || claims.filter((c) => c.material).length < 2) {
      throw new Error('Intelligence output did not include enough traceable claims');
    }

    const insights: AssetInsights = {
      thesis: brief.thesis,
      bullCase: brief.bullCase,
      bearCase: brief.bearCase,
      catalysts: brief.catalysts,
    };

    return { claims, brief, insights };
  };

  // One retry with lower temperature if compliance/citations fail.
  const first = await attempt(0.35);
  let trust = auditCitations({ sources, claims: first.claims });
  let compliance = runComplianceGuard(stringifyForCompliance({ sources, claims: first.claims, brief: first.brief }));

  if (trust.unknownCitationIds.length > 0 || trust.unsupportedMaterialClaims.length > 0 || !compliance.informationalOnly) {
    const second = await attempt(0.2);
    trust = auditCitations({ sources, claims: second.claims });
    compliance = runComplianceGuard(stringifyForCompliance({ sources, claims: second.claims, brief: second.brief }));

    if (trust.unknownCitationIds.length > 0) {
      throw new Error(`Intelligence output cited unknown sources: ${trust.unknownCitationIds.join(', ')}`);
    }
    if (trust.unsupportedMaterialClaims.length > 0) {
      throw new Error('Intelligence output included unsupported material claims');
    }
    if (!compliance.informationalOnly) {
      throw new Error('Intelligence output failed compliance guard');
    }

    return {
      version: 1,
      provider,
      retrievedAt,
      sources,
      claims: second.claims,
      brief: second.brief,
      insights: second.insights,
      compliance,
      trust,
    };
  }

  if (trust.unknownCitationIds.length > 0) {
    throw new Error(`Intelligence output cited unknown sources: ${trust.unknownCitationIds.join(', ')}`);
  }
  if (trust.unsupportedMaterialClaims.length > 0) {
    throw new Error('Intelligence output included unsupported material claims');
  }
  if (!compliance.informationalOnly) {
    throw new Error('Intelligence output failed compliance guard');
  }

  return {
    version: 1,
    provider,
    retrievedAt,
    sources,
    claims: first.claims,
    brief: first.brief,
    insights: first.insights,
    compliance,
    trust,
  };
}
