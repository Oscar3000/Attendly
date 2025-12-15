"use client";

import { use } from "react";
import { InvitePageProps, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/button";
import InviteNotFound from "@/components/invite-not-found";
import { QrCode } from "@/components/qr-code";
import { useGetInvitationQuery, useUpdateRsvpStatusMutation } from "@/store/invitationApi";
import { downloadQRCode } from "@/lib/utils";

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params) as { id: string };
  
  // RTK Query hooks
  const {
    data: invitationData,
    isLoading: loading,
    error,
    isError,
  } = useGetInvitationQuery(resolvedParams.id);
  
  const [updateRsvpStatus, { isLoading: isUpdating }] = useUpdateRsvpStatusMutation();

  const invite = invitationData?.invitation;
  const inviteNotFound = isError && 'status' in (error as object) && (error as { status: number }).status === 404;
  const rsvpStatus = invite?.status || "pending";

  const handleRsvp = async (status: RsvpStatus) => {
    try {
      await updateRsvpStatus({ 
        id: resolvedParams.id, 
        status 
      }).unwrap();
    } catch (err) {
      console.error('Failed to update RSVP status:', err);
      // You could add a toast notification here
    }
  };

  const handleDownloadQR = () => {
    if (!invite?.qrCode) return;
    downloadQRCode(invite.qrCode, `invitation-qr-${invite.name}`);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (inviteNotFound) {
    return (
      <InviteNotFound
        inviteId={resolvedParams.id}
        onGoHome={() => (window.location.href = "/")}
      />
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load invitation. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Invitation
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Something went wrong while loading your invitation."}
          </p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF9F4" }}>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            You&apos;re Invited!
          </h1>
          <p className="text-lg text-gray-600">Wedding Celebration</p>
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Dear {invite.name}
            </h2>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Event Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {formatDate(invite.eventDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {formatTime(invite.eventDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{invite.venue}</span>
                </div>
                {invite.plusOne && invite.plusOne > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Guests:</span>
                    <span className="font-medium text-green-600">
                      {invite.plusOne}{" "}
                      {invite.plusOne === 1 ? "person" : "people"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RSVP Status */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              RSVP Status
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Current Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    rsvpStatus === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {rsvpStatus === "confirmed" ? "Confirmed" : "Pending"}
                </span>
              </div>

              {rsvpStatus === "pending" && (
                <div
                  className="flex justify-center"
                  style={{ marginTop: "50px" }}
                >
                  <Button
                    variant="attendly"
                    onClick={() => handleRsvp("confirmed")}
                    disabled={isUpdating}
                    loading={isUpdating}
                  >
                    {isUpdating ? "Confirming..." : "Confirm Invitation"}
                  </Button>
                </div>
              )}

              {rsvpStatus === "confirmed" && (
                <div className="text-center">
                  <p className="text-green-600 text-lg font-medium">
                    ✓ Your invitation has been confirmed!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Share Your Invitation
            </h3>
            <p className="text-gray-600 mb-4">
              Share this QR code with others to view this invitation
            </p>
            <div className="flex justify-center mb-4">
              {invite?.qrCode && invite.qrCode.startsWith('data:') ? (
                <QrCode 
                  src={invite.qrCode}
                  size={150}
                  alt="Share invitation QR code"
                />
              ) : (
                <QrCode 
                  size={150}
                  alt="Share invitation QR code"
                />
              )}
            </div>
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleDownloadQR}
                disabled={!invite?.qrCode?.startsWith('data:')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download QR Code
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Invitation ID: {resolvedParams.id}</p>
          <p className="mt-1">
            Questions? Please reach out to the coordinator for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
