"use client";

import { useEffect, useState, use } from "react";
import { InvitePageProps, InviteDetails, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/button";
import InviteNotFound from "@/components/invite-not-found";

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = use(params) as { id: string };
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteNotFound, setInviteNotFound] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>("pending");

  useEffect(() => {
    // Fetch invite details from API
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/invitations/${resolvedParams.id}`);

        if (response.status === 404) {
          setInviteNotFound(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch invitation");
        }

        const data = await response.json();
        setInvite(data.invitation);
        setRsvpStatus(data.invitation.status);
      } catch {
        setError("Failed to load invitation. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [resolvedParams.id]);

  const handleRsvp = async (status: RsvpStatus) => {
    try {
      const response = await fetch(`/api/invitations/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update RSVP status");
      }

      const data = await response.json();
      setRsvpStatus(data.invitation.status);
      setInvite(data.invitation);
    } catch {
      setError("Failed to update RSVP. Please try again.");
    }
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
                  >
                    Confirm Invitation
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
