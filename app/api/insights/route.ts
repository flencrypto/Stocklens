import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for OpenAI insight generation.
 *
 * Reads OPENAI_KEY from the server's runtime environment (not bundled into
 * the client at build-time) and calls the OpenAI Chat Completions API.
 * The endpoint only accepts a purpose-specific request body (asset type,
 * data snapshot, and assetClass), builds the prompt server-side, and
 * returns the parsed AssetInsights JSON — preventing this route from
 * being used as a generic OpenAI proxy.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

function buildSnapshot(
  type: string,
  data: Record<string, unknown>,
  assetClass: string,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = { assetType: type, assetClass };
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.length > 600) {
      snapshot[key] = value.slice(0, 600) + '…';
    } else {
      snapshot[key] = value;
    }
  }
  return snapshot;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No OpenAI API key configured on server' },
      { status: 503 },
    );
  }

  let body: { type?: string; data?: Record<string, unknown>; assetClass?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, data, assetClass } = body;
  if (!type || !data || !assetClass) {
    return NextResponse.json(
      { error: 'Missing required fields: type, data, assetClass' },
      { status: 400 },
    );
  }

  const snapshot = buildSnapshot(type, data, assetClass);

  const systemPrompt =
    'You are an experienced equity and crypto research analyst. ' +
    'Given a structured snapshot of an asset, produce concise, evidence-based ' +
    'investment insights. Reference the supplied numbers where relevant ' +
    '(e.g. revenue growth, margins, market cap rank, 30d momentum). ' +
    'Avoid generic platitudes and never give personalised financial advice. ' +
    'Respond with strict JSON only — no markdown, no commentary.';

  const userPrompt = [
    'Generate investment insights for the following asset.',
    'Return JSON with this exact shape:',
    '{',
    '  "thesis": string,            // 1-2 sentence investment thesis',
    '  "bullCase": string[],        // exactly 5 short bullet points',
    '  "bearCase": string[],        // exactly 5 short bullet points',
    '  "catalysts": string[]        // exactly 5 short bullet points',
    '}',
    'Each bullet should be a single sentence, ideally referencing a',
    'specific metric from the snapshot when possible.',
    '',
    'Asset snapshot:',
    JSON.stringify(snapshot),
  ].join('\n');

  let openAiRes: Response;
  try {
    openAiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
  } catch (err) {
    console.error('[insights] OpenAI fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to reach OpenAI API' },
      { status: 502 },
    );
  }

  let openAiJson: { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
  try {
    openAiJson = await openAiRes.json();
  } catch {
    return NextResponse.json(
      { error: `OpenAI returned non-JSON response (HTTP ${openAiRes.status})` },
      { status: 502 },
    );
  }

  if (!openAiRes.ok) {
    const msg = openAiJson?.error?.message || `OpenAI request failed (HTTP ${openAiRes.status})`;
    return NextResponse.json({ error: msg }, { status: openAiRes.status });
  }

  const content = openAiJson?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: 'OpenAI response did not contain any content' },
      { status: 502 },
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse OpenAI response as JSON' },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed);
}
