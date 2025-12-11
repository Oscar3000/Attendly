"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { EditInviteForm, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/button";
import { useGetInvitationQuery, useUpdateInvitationMutation } from "@/store/invitationApi";

interface EditInvitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditInvitePage({ params }: EditInvitePageProps) {
  const resolvedParams = use(params) as { id: string };
  const router = useRouter();
  
  const { data, isLoading: loading, error } = useGetInvitationQuery(resolvedParams.id);
  const [updateInvitation, { isLoading: isSubmitting }] = useUpdateInvitationMutation();

  const invitation = data?.invitation;

  // Initialize form with invitation data when available
  const initialForm = useMemo(() => {
    if (invitation) {
      return {
        id: invitation.id,
        name: invitation.name,
        eventDate: new Date(invitation.eventDate).toISOString().slice(0, 16),
        venue: invitation.venue,
        status: invitation.status,
        plusOne: invitation.plusOne ?? 0,
      };
    }
    return {
      id: resolvedParams.id,
      name: "",
      eventDate: "",
      venue: "",
      status: "pending" as RsvpStatus,
      plusOne: 0,
    };
  }, [invitation, resolvedParams.id]);

  const [form, setForm] = useState<EditInviteForm>(initialForm);

  // Update form when initialForm changes
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateInvitation({
        id: resolvedParams.id,
        data: {
          name: form.name,
          eventDate: form.eventDate,
          venue: form.venue,
          status: form.status,
          plusOne: form.plusOne,
        }
      }).unwrap();
      
      router.push("/admin");
    } catch (error) {
      console.error("Error updating invite:", error);
      alert("Failed to update invitation. Please try again.");
    }
  };

  const handleInputChange = (
    field: keyof Omit<EditInviteForm, "id">,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">Failed to load invitation</p>
          <Button
            variant="primary"
            onClick={() => router.push("/admin")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div
        className="max-w-2xl mx-auto"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Edit Invite</h1>
          <p className="text-gray-600">Invitation ID: {form.id}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Event Date Field */}
          <div>
            <label
              htmlFor="eventDate"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Event Date & Time
            </label>
            <input
              type="datetime-local"
              id="eventDate"
              value={form.eventDate}
              onChange={(e) => handleInputChange("eventDate", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Venue Field */}
          <div>
            <label
              htmlFor="venue"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Venue
            </label>
            <input
              type="text"
              id="venue"
              value={form.venue}
              onChange={(e) => handleInputChange("venue", e.target.value)}
              placeholder="Enter venue"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Plus One Field */}
          <div>
            <label
              htmlFor="plusOne"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Plus One (Additional Guests)
            </label>
            <input
              type="number"
              id="plusOne"
              value={form.plusOne}
              onChange={(e) =>
                handleInputChange(
                  "plusOne",
                  parseInt(e.target.value) || 0,
                )
              }
              placeholder="Enter number"
              min="0"
              max="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Status Field */}
          <div>
            <label
              htmlFor="status"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Status
            </label>
            <div className="relative">
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  handleInputChange("status", e.target.value as RsvpStatus)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                }}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
                <option value="rescinded">Rescinded</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              variant="attendly"
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
