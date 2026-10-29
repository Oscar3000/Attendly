/**
 * Page shell for the sign-in and sign-up forms: brand header, white card, footer slot
 */

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9F4] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-inter mb-2 text-2xl font-semibold text-black sm:text-3xl">
            Attendly
          </h1>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="font-inter mb-6 text-xl font-bold text-black sm:text-2xl">{title}</h2>
          {children}
        </div>

        {footer && (
          <div className="font-inter mt-6 space-y-2 text-center text-sm text-[#666666]">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

// Form-level error (wrong credentials, rate limits, server errors)
export function FormError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="font-inter mb-4 rounded-lg bg-[#FFE5E5] p-3 text-sm text-[#D32F2F]"
    >
      {message}
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="font-inter w-full rounded-lg bg-[#C07A54] px-4 py-2 text-base font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
