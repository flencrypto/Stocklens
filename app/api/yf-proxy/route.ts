import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for Yahoo Finance API requests.
 *
 * The Yahoo Finance v8 chart endpoint does not send CORS headers, so
 * browser-originated fetches are blocked. By routing through this API
 * route the request originates from the Next.js server (no CORS
 * restriction) and the response is forwarded back to the client.
 *
 * To prevent Server-Side Request Forgery (SSRF), the target base URL is
 * hardcoded on the server. Clients supply only the path+query portion via
 * the `path` parameter, which is validated before being appended.
 */

const YF_BASE = 'https://query1.finance.yahoo.com';

// Only paths starting with these segments are proxied.
const ALLOWED_PATH_PREFIXES = ['/v1/finance/', '/v8/finance/'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Prevent path traversal and restrict to known Yahoo Finance API paths.
  if (!ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  // Reconstruct the full URL on the server — the base is never client-supplied.
  const targetUrl = `${YF_BASE}${path}`;

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    });
  } catch (err) {
    console.error('[yf-proxy] fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to reach Yahoo Finance' },
      { status: 502 },
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json(
      { error: `Yahoo Finance returned non-JSON response (HTTP ${res.status})` },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: res.status });
}
