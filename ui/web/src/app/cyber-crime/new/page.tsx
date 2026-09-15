import { redirect } from "next/navigation";

/** Complaints are taken in from the intake dialog on /cyber-intelligence. */
export default function NewCyberCrimeRedirect() {
  redirect("/cyber-intelligence");
}
