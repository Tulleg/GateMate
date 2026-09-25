import { redirect } from "next/navigation";

export default function DashboardLegalRedirect() {
  redirect("/organizer/settings/legal");
}
