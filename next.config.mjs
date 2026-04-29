/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose the Vercel-managed `OPENAI_KEY` (Sensitive, Production + Preview)
  // to the Next.js bundle at build time. Stocklens calls the OpenAI API from
  // the browser, so this value is inlined into the client bundle. Only use
  // this for personal/internal deployments where shipping the key to clients
  // is acceptable; otherwise rely on the in-app runtime key input.
  env: {
    OPENAI_KEY: process.env.OPENAI_KEY,
  },
};

export default nextConfig;
