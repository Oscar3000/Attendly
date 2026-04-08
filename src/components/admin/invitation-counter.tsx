interface InvitationCounterProps {
  totalInvitations: number;
}

export default function InvitationCounter({
  totalInvitations,
}: InvitationCounterProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        Invitations Counter
      </h2>
      <div className="text-center">
        <div className="text-4xl sm:text-6xl font-bold text-gray-900 mb-2">
          {totalInvitations}
        </div>
        <div className="text-gray-600">Invitations</div>
      </div>
    </div>
  );
}
