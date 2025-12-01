interface InviteNotFoundProps {
  inviteId: string;
  onGoHome: () => void;
}

export default function InviteNotFound({
  inviteId,
  onGoHome,
}: InviteNotFoundProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FFF9F4" }}
    >
      <div className="text-center max-w-md mx-auto p-6">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Invitation Not Found
        </h1>

        {/* Description */}
        <div className="space-y-3 mb-8">
          <p className="text-gray-600 leading-relaxed">
            We couldn&apos;t find an invitation with ID:{" "}
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {inviteId}
            </span>
          </p>
          <p className="text-gray-600 leading-relaxed">
            This invitation may have been:
          </p>
          <ul className="text-left text-gray-600 space-y-1 max-w-xs mx-auto">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
              Deleted or rescinded
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
              Expired
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></span>
              Entered incorrectly
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={onGoHome}
            className="w-full text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              height: "50px",
              borderRadius: "12px",
              backgroundColor: "#C07A54",
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: "16px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go to Home Page
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Need help?</p>
            <p className="text-blue-600 text-sm font-medium">
              Please reach out to the coordinator for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
