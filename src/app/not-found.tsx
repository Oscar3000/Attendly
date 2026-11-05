import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <ErrorScreen
      label="404"
      title="Page not found"
      detail="This link may be wrong or out of date. If someone sent it to you, ask them for a new one."
    >
      <Link href="/" className={buttonClasses()}>
        Go to Attendly
      </Link>
    </ErrorScreen>
  );
}
