import { redirect } from "next/navigation";

/** An evidence item's record, chain of custody and integrity live at /custody/[id]. */
export default async function EvidenceItemRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/custody/${encodeURIComponent(id)}`);
}
