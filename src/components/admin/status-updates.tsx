import { StatusUpdate } from "@/lib/types";
import { formatTimeAgo, getStatusColor } from "@/lib/utils";

interface StatusUpdatesProps {
  updates: StatusUpdate[];
}

export default function StatusUpdates({ updates }: StatusUpdatesProps) {

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Status Updates</h2>
      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">
            No recent status updates
          </div>
        ) : (
          updates.map((update) => (
            <div key={update.id} className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{update.name}</div>
                <div className={`text-sm ${getStatusColor(update.status)}`}>
                  {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatTimeAgo(update.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
