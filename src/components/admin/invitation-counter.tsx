interface InvitationCounterProps {
  totalInvitations: number;
  totalGuests: number;
}

export default function InvitationCounter({
  totalInvitations,
  totalGuests,
}: InvitationCounterProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        Invitations Counter
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-4xl sm:text-6xl font-bold text-gray-900 mb-2">
            {totalInvitations}
          </div>
          <div className="text-gray-600">Invitations</div>
        </div>
        <div className="text-center">
          <div
            className="text-4xl sm:text-6xl font-bold mb-2"
            style={{ color: "#C07A54" }}
          >
            {totalGuests}
          </div>
          <div className="text-gray-600">Total Guests</div>
        </div>
      </div>
    </div>
  );
}
