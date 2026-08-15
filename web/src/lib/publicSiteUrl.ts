export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_CANONICAL_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://crisdalagency.vercel.app"
).replace(/\/$/, "");
