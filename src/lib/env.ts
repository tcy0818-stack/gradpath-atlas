// Environment validation (SEC-03, SEC-04). Reports every missing variable at once, by name only.
// NEXT_PUBLIC_* must be referenced literally so Next.js can inline them into the browser bundle.
type Source = Record<string, string | undefined>;

const publicSource = (): Source => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

function read(names: string[], src: Source, urlNames: string[] = []) {
  const problems: string[] = [];
  const out: Record<string, string> = {};
  for (const name of names) {
    const v = src[name]?.trim();
    if (!v) problems.push(`${name} is missing`);
    else if (urlNames.includes(name) && !URL.canParse(v)) problems.push(`${name} is not a valid URL`);
    else out[name] = v;
  }
  if (problems.length) {
    throw new Error(
      `Invalid environment: ${problems.join("; ")}. Copy .env.example to .env.local and set the values.`,
    );
  }
  return out;
}

/** Browser-safe settings. */
export function publicEnv(src: Source = publicSource()) {
  const e = read(
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SITE_URL"],
    src,
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL"],
  );
  return {
    supabaseUrl: e.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: e.NEXT_PUBLIC_SITE_URL,
  };
}

/** The only place the secret key is read. Call from server-only code (account deletion, Phase 6). */
export function serverSecretKey(src: Source = process.env) {
  return read(["SUPABASE_SECRET_KEY"], src).SUPABASE_SECRET_KEY;
}
