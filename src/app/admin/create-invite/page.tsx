"use client";

import { useState } from "react";
import { CreateInviteForm, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/button";
import { useCreateInvitationMutation } from "@/store/invitationApi";
import { useRouter } from "next/navigation";

export default function CreateInvitePage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateInviteForm>({
    name: "",
    eventDate: "2026-05-23T15:00",
    venue: "Canary World, Lagos, Nigeria",
    status: "pending",
    plusOne: 0,
  });

  const [createInvitation, { isLoading: isSubmitting }] = useCreateInvitationMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createInvitation(form).unwrap();
      router.push(`/admin/create-invite/success?id=${result.invitation.id}`);
    } catch (error) {
      console.error("Error creating invite:", error);
      alert("Failed to create invitation. Please try again.");
    }
  };

  const handleInputChange = (
    field: keyof CreateInviteForm,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Create Invite
          </h1>
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
              Plus One (Number of additional guests)
            </label>
            <input
              type="number"
              id="plusOne"
              value={form.plusOne}
              onChange={(e) =>
                handleInputChange("plusOne", parseInt(e.target.value) || 0)
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
              Initial Status
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
