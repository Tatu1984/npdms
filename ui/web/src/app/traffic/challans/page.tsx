import { redirect } from "next/navigation";

/** The challan register lives at /traffic; this route forwards old links. */
export default function ChallansRedirect() {
  redirect("/traffic");
}
