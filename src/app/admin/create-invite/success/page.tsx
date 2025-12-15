"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { QrCode } from "@/components/qr-code";
import { useGetInvitationQuery } from "@/store/invitationApi";

export default function InviteSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationId = searchParams.get("id");
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<"link" | "qr">("qr");

  const { data, isLoading, error } = useGetInvitationQuery(invitationId || "", {
    skip: !invitationId
  });

  const invitation = data?.invitation;
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invitationId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Wedding Invitation - ${invitation?.name}`,
          text: `You&apos;re invited! View your wedding invitation.`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Wedding Invitation - ${invitation?.name}`);
    const body = encodeURIComponent(
      `You're invited to our wedding!\n\nView your invitation: ${inviteUrl}\n\nWe can't wait to celebrate with you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `You're invited to our wedding! 💒\n\nView your invitation: ${inviteUrl}\n\nWe can't wait to celebrate with you! 🎉`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadQR = () => {
    if (!invitation?.qrCode || !invitation.qrCode.startsWith("data:")) return;
    
    const link = document.createElement("a");
    link.download = `invitation-qr-${invitation.name.replace(/\s+/g, "-")}.png`;
    link.href = invitation.qrCode;
    link.click();
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invitation Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find the invitation you&apos;re looking for.
          </p>
          <Button variant="primary" onClick={() => router.push("/admin")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF9F4" }}>
      <div className="max-w-2xl mx-auto p-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Invitation Created Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Your invitation for <strong>{invitation.name}</strong> is ready to share
          </p>
        </div>

        {/* Invitation Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Invitation Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{invitation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event Date:</span>
              <span className="font-medium">
                {new Date(invitation.eventDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue:</span>
              <span className="font-medium">{invitation.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plus One:</span>
              <span className="font-medium">
                {invitation.plusOne === 0 ? "No" : `Yes (+${invitation.plusOne})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{invitation.status}</span>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Share Invitation
          </h2>

          {/* Share Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setShareMethod("qr")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                shareMethod === "qr"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setShareMethod("link")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                shareMethod === "link"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Link
            </button>
          </div>

          {shareMethod === "qr" && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Share this QR code for easy access to the invitation
              </p>
              <div className="flex justify-center mb-6">
                {invitation.qrCode && invitation.qrCode.startsWith("data:") ? (
                  <QrCode
                    src={invitation.qrCode}
                    size={200}
                    alt={`QR Code for ${invitation.name}'s invitation`}
                  />
                ) : (
                  <QrCode
                    size={200}
                    alt={`QR Code for ${invitation.name}'s invitation`}
                  />
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="secondary"
                  onClick={handleDownloadQR}
                  disabled={!invitation.qrCode?.startsWith("data:")}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download QR Code
                </Button>
                <Button variant="secondary" onClick={handleShare}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </Button>
              </div>
            </div>
          )}

          {shareMethod === "link" && (
            <div>
              <p className="text-gray-600 mb-4">
                Share this link to give access to the invitation
              </p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700"
                />
                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="secondary" onClick={handleShare}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share Link
                </Button>
                <Button variant="secondary" onClick={handleEmailShare}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email
                </Button>
                <Button variant="secondary" onClick={handleWhatsAppShare}>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.open(`/invite/${invitation.id}`, '_blank')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Invitation
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/admin/edit-invite/${invitation.id}`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Invitation
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/admin")}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            Back to Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push("/admin/create-invite")}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Another
          </Button>
        </div>
      </div>
    </div>
  );
}