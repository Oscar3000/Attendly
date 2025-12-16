import { InvitationTableEntry } from "@/lib/types";
import { QrCode } from "../qr-code";
import { downloadQRCode, getTableStatusColor } from "@/lib/utils";

interface InvitationsTableProps {
  invitations: InvitationTableEntry[];
  onEdit: (id: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | undefined;
  onPageChange?: (page: number) => void;
}

export default function InvitationsTable({
  invitations,
  onEdit,
  pagination,
  onPageChange,
}: InvitationsTableProps) {
  const handleDownloadQR = (invitation: InvitationTableEntry) => {
    if (invitation.qrCode) {
      downloadQRCode(invitation.qrCode, `invitation-qr-${invitation.name}`);
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
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTableStatusColor(invitation.status)}`}
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
                    disabled={!invitation.hasQrCode}
                  >
                    {invitation.hasQrCode && invitation.qrCode ? (
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
                    {invitation.hasQrCode && (
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
      
      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invitations
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md enabled:hover:text-[rgb(192,122,84)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show current page, first/last pages, and pages around current
                return page === 1 || 
                       page === pagination.totalPages || 
                       (page >= pagination.page - 1 && page <= pagination.page + 1);
              })
              .map((page, index, array) => {
                // Add ellipsis if there's a gap
                const previousPage = array[index - 1];
                const showEllipsis = index > 0 && previousPage !== undefined && page - previousPage > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => onPageChange?.(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        page === pagination.page
                          ? 'text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                      style={page === pagination.page ? { backgroundColor: 'rgb(192, 122, 84)' } : undefined}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}
            
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md enabled:hover:text-[rgb(192,122,84)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
