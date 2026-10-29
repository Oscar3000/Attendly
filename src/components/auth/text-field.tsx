/**
 * Labelled input with an inline error, linked for screen readers via aria-describedby
 */

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
}

export function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="font-inter mb-2 block text-sm font-medium text-[#333333]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`font-inter w-full rounded-lg border px-4 py-2 text-sm text-[#333333] focus:ring-2 focus:outline-none ${
          error ? "border-[#D32F2F]" : "border-[#E0E0E0]"
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="font-inter mt-1 text-sm text-[#D32F2F]">
          {error}
        </p>
      )}
    </div>
  );
}
