import { StatusUpdate } from '@/lib/types';

interface StatusUpdatesProps {
  updates: StatusUpdate[];
}

export default function StatusUpdates({ updates }: StatusUpdatesProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600';
      case 'rescinded':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Status Updates
      </h2>
      <div className="space-y-4">
        {updates.map((update) => (
          <div key={update.id} className="flex justify-between items-start">
            <div>
              <div className="font-medium text-gray-900">
                {update.guestName}
              </div>
              <div className={`text-sm ${getStatusColor(update.status)}`}>
                {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatTimeAgo(update.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}