import { buttonClasses } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import type { InvitationTableEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InvitationsTableProps {
  invitations: InvitationTableEntry[];
  onOpen: (id: string) => void;
  pagination?:
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  // The reply group the list is filtered to, like "Confirmed"
  filterLabel?: string | undefined;
  onClearFilter: () => void;
  // A new page or filter is loading; the old rows stay until it arrives
  loading?: boolean;
}

export default function InvitationsTable({
  invitations,
  onOpen,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  filterLabel,
  onClearFilter,
  loading = false,
}: InvitationsTableProps) {
  const narrowed = Boolean(filterLabel || search.trim());
  const total = pagination?.total ?? invitations.length;

  return (
    <section className="rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          Guests{" "}
          <span className="ml-1 font-mono text-[15px] font-normal tracking-normal text-slate">
            {filterLabel ? `${filterLabel} · ${total}` : total}
          </span>
        </h2>
        <div className="flex flex-[1_1_100%] flex-wrap gap-2 sm:flex-[0_1_420px] sm:justify-end">
          {filterLabel && (
            <button
              type="button"
              onClick={onClearFilter}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Clear filter
            </button>
          )}
          <label className="block min-w-0 flex-[1_1_220px]">
            <span className="sr-only">Search by name</span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name"
              className="h-11 w-full rounded-full border-[1.5px] border-line bg-card px-4"
            />
          </label>
        </div>
      </div>

      {invitations.length === 0 ? (
        <p className="mx-3 my-6 text-slate">
          {narrowed
            ? "No guests match. Try another name or clear the filter."
            : "No guests yet. Add your first guests to get started."}
        </p>
      ) : (
        <div
          aria-busy={loading}
          className={cn("mt-4 overflow-x-auto transition-opacity", loading && "opacity-60")}
        >
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="text-left font-mono text-[13px] text-slate">
                <th scope="col" className="px-3 py-2 font-normal">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 font-normal">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 font-normal">
                  Admits
                </th>
                <th scope="col" className="px-3 py-2 text-right font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="border-t border-sand transition-colors hover:bg-paper"
                >
                  <td className="px-3 py-1">
                    <button
                      type="button"
                      onClick={() => onOpen(invitation.id)}
                      className="min-h-11 text-left font-semibold"
                    >
                      {invitation.name}
                    </button>
                  </td>
                  <td className="px-3 py-1">
                    <StatusChip status={invitation.status} />
                  </td>
                  <td className="px-3 py-1 font-mono text-[15px]">
                    {(invitation.plusOne ?? 0) + 1}
                  </td>
                  <td className="px-3 py-1 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpen(invitation.id)}
                      aria-label={`Open ticket for ${invitation.name}`}
                      className="min-h-11 px-2 text-[15px] font-semibold underline"
                    >
                      Open ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[13px] text-slate">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
