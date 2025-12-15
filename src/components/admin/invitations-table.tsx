import { InvitationTableEntry } from "@/lib/types";
import { QrCode } from "../qr-code";
import { downloadQRCode } from "@/lib/utils";

interface InvitationsTableProps {
  invitations: InvitationTableEntry[];
  onEdit: (id: string) => void;
}

export default function InvitationsTable({
  invitations,
  onEdit,
}: InvitationsTableProps) {
  const handleDownloadQR = (invitation: InvitationTableEntry) => {
    downloadQRCode(invitation.qrCode, `invitation-qr-${invitation.name}`);
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "text-green-600 bg-green-50";
      case "rescinded":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        All Invitations
      </h2>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Status
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                QR Code
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation, index) => (
              <tr
                key={invitation.id}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">
                    {invitation.name}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invitation.status)}`}
                  >
                    {invitation.status.charAt(0).toUpperCase() +
                      invitation.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => handleDownloadQR(invitation)}
                    className="group relative transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    title="Click to download QR code"
                    disabled={!invitation.qrCode.startsWith('data:')}
                  >
                    {invitation.qrCode.startsWith('data:') ? (
                      <QrCode 
                        src={invitation.qrCode}
                        size={60}
                        alt={`QR Code for ${invitation.name}`}
                      />
                    ) : (
                      <QrCode 
                        size={60}
                        alt={`QR Code for ${invitation.name}`}
                      />
                    )}
                    {/* Download overlay on hover */}
                    {invitation.qrCode.startsWith('data:') && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <svg 
                          className="w-6 h-6 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => onEdit(invitation.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
