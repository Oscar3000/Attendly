import { redirect } from "next/navigation";

// Until the product landing page (T-409): hosts go to their events, signed-out visitors to
// /login (via middleware). Each event's own page is /e/[slug]
export default function HomePage() {
  redirect("/dashboard");
}
