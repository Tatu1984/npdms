import { redirect } from "next/navigation";

/** A complaint's record, entities, money trail and freezes live at /cyber-intelligence/[id]. */
export default async function CyberCrimeItemRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cyber-intelligence/${encodeURIComponent(id)}`);
}
