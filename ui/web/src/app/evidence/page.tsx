import { redirect } from "next/navigation";

/**
 * The evidence register lives at /custody (Phase 02): registration, file
 * attachment with a server-computed SHA-256, integrity verification, signed
 * custody transfers and the access log. This route kept a second, unsigned
 * evidence UI; it now forwards so old links and bookmarks still land.
 */
export default async function EvidenceRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/custody?${query}` : "/custody");
}
