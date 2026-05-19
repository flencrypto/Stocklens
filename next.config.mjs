/** @type {import('next').NextConfig} */
const nextConfig = {
  // AI keys should remain server-side (used by `app/api/insights`).
  // If you intentionally want a client-shipped key (not recommended), use
  // a `NEXT_PUBLIC_*` env var and a custom client integration.
};

export default nextConfig;
