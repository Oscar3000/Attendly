"use client";

import { useState } from "react";
import { fieldErrorsFrom } from "@/components/events/event-form";
import {
  useRemoveEventCoverMutation,
  useUploadEventCoverMutation,
} from "@/store/eventInvitationApi";
import { FieldError, labelClass, smallButtonClass } from "./settings-fields";

// Uploads or removes the cover straight away, separately from the Save button (T-406)
export function CoverImageField({
  eventId,
  initialUrl,
}: {
  eventId: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string>();
  const [uploadCover, { isLoading: uploading }] = useUploadEventCoverMutation();
  const [removeCover, { isLoading: removing }] = useRemoveEventCoverMutation();
  const busy = uploading || removing;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    try {
      setUrl((await uploadCover({ eventId, file }).unwrap()).coverImageUrl);
    } catch (err) {
      setError(
        fieldErrorsFrom<"file">(err)?.file ?? "Couldn't upload the image. Please try again.",
      );
    }
  };

  const handleRemove = async () => {
    setError(undefined);
    try {
      await removeCover({ eventId }).unwrap();
      setUrl(null);
    } catch {
      setError("Couldn't remove the image. Please try again.");
    }
  };

  return (
    <div className="mb-4">
      <span className={labelClass}>Cover image</span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- already resized server-side
        <img
          src={url}
          alt="Current cover"
          className="mb-3 max-h-56 w-full rounded-2xl object-cover"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`${smallButtonClass} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink`}
        >
          {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void handleFile(e)}
            disabled={busy}
            aria-describedby="cover-help cover-error"
            className="sr-only"
          />
        </label>
        {url && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={busy}
            className={smallButtonClass}
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        )}
      </div>
      <p id="cover-help" className="mt-1.5 text-sm text-slate">
        JPEG, PNG or WebP, up to 5 MB. Saved right away.
      </p>
      <FieldError id="cover-error" message={error} />
    </div>
  );
}
