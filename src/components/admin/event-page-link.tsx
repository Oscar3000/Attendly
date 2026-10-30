"use client";

import { useState } from "react";

/**
 * Shown above every page of an event's dashboard: where the event's public page is, with a
 * link to open it and a button to copy its full URL for sharing
 */
export function EventPageLink({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const path = `/e/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setStatus("copied");
    } catch {
      // Clipboard access can be refused (permissions, an insecure origin)
      setStatus("failed");
    }
  };

  return (
    <div className="font-inter flex flex-col gap-2 border-b border-[#E0E0E0] bg-white px-4 py-2 text-sm text-[#333333] sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 truncate">
        Event page:{" "}
        <a
          href={path}
          target="_blank"
          rel="noopener"
          className="font-medium text-[#C07A54] underline-offset-2 hover:underline"
        >
          {path}
        </a>
      </p>
      <div className="flex items-center gap-3">
        <span role="status" className="text-xs text-[#666666]">
          {status === "copied" && "Link copied"}
          {status === "failed" && "Couldn't copy; open the page and copy its address"}
        </span>
        <a
          href={path}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
        >
          View
        </a>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}
