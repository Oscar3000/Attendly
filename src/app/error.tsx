"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";
import { ErrorScreen } from "@/components/ui/error-screen";

// Next.js logs the error itself, so nothing about it needs to reach the page
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorScreen
      label="Error"
      title="Something went wrong"
      detail="Please try again. If it keeps happening, come back in a little while."
    >
      <Button onClick={reset}>Try again</Button>
      <Link href="/" className={buttonClasses({ variant: "outline" })}>
        Go to Attendly
      </Link>
    </ErrorScreen>
  );
}
