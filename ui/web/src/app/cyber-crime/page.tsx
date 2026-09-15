import { redirect } from "next/navigation";

/**
 * Phase 05 lives at /cyber-intelligence: complaint intake, recorded entities,
 * the money trail, freeze requests, recoveries, clusters and the network.
 * This route held an older mock screen; it forwards so old links still land.
 */
export default function CyberCrimeRedirect() {
  redirect("/cyber-intelligence");
}
