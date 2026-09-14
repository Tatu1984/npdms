import { redirect } from "next/navigation";

/**
 * Evidence is registered from the Phase 02 register. A case or FIR passed here
 * (?caseId= / ?firId=) is carried across so the item is linked on registration.
 */
export default async function NewEvidenceRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const incoming = await searchParams;
  const params = new URLSearchParams({ register: "1" });
  for (const key of ["caseId", "firId"]) {
    const value = incoming[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  redirect(`/custody?${params.toString()}`);
}
