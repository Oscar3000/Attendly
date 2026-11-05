"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/text-field";

const MIN_LENGTH = 8;

interface PasswordFieldProps extends Omit<React.ComponentProps<typeof TextField>, "type"> {
  value: string;
  // Shows how far the password is from the minimum length, for a new password
  showProgress?: boolean;
}

/**
 * A password input with a show/hide button
 */
export function PasswordField({ showProgress = false, ...fieldProps }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);
  const left = MIN_LENGTH - fieldProps.value.length;

  return (
    <TextField
      {...fieldProps}
      type={shown ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown(!shown)}
          className="h-11 px-3 text-sm font-semibold text-ink"
        >
          {shown ? "Hide" : "Show"}
        </button>
      }
      hint={
        showProgress ? (
          <span className="mt-2 flex items-center gap-2.5">
            <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
              <span
                className={`block h-full transition-[width] duration-200 ${left > 0 ? "bg-ember" : "bg-ink"}`}
                style={{ width: `${Math.min(100, (fieldProps.value.length / MIN_LENGTH) * 100)}%` }}
              />
            </span>
            <span className="font-mono text-[13px] text-slate">
              {left > 0 ? `${left} more ${left === 1 ? "character" : "characters"}` : "Good to go"}
            </span>
          </span>
        ) : undefined
      }
    />
  );
}
