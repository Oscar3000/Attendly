"use client";

import { useState } from "react";
import { CreateInviteForm, RsvpStatus } from "@/lib/types";
import { Button } from "@/components/button";

export default function CreateInvitePage() {
  const [form, setForm] = useState<CreateInviteForm>({
    guestName: "",
    guestEmail: "",
    eventDate: "2026-05-23T15:00",
    venue: "Canary World, Lagos, Nigeria",
    rsvpStatus: "pending",
    plusOne: 0,
    dietaryRestrictions: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Failed to create invitation');
      }

      const result = await response.json();
      console.log("Created invite:", result.invitation);

      // Redirect back to admin dashboard
      window.location.href = "/admin";
    } catch (error) {
      console.error("Error creating invite:", error);
      alert("Failed to create invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          {/* Guest Name Field */}
          <div>
            <label
              htmlFor="guestName"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Guest Name
            </label>
            <input
              type="text"
              id="guestName"
              value={form.guestName}
              onChange={(e) => handleInputChange("guestName", e.target.value)}
              placeholder="Enter guest name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Guest Email Field */}
          <div>
            <label
              htmlFor="guestEmail"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Email Address
            </label>
            <input
              type="email"
              id="guestEmail"
              value={form.guestEmail}
              onChange={(e) => handleInputChange("guestEmail", e.target.value)}
              placeholder="Enter email address"
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

          {/* Dietary Restrictions Field */}
          <div>
            <label
              htmlFor="dietaryRestrictions"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Dietary Restrictions
            </label>
            <textarea
              id="dietaryRestrictions"
              value={form.dietaryRestrictions}
              onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
              placeholder="Enter any dietary restrictions"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
            />
          </div>

          {/* Message Field */}
          <div>
            <label
              htmlFor="message"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Personal Message
            </label>
            <textarea
              id="message"
              value={form.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              placeholder="Enter a personal message"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
            />
          </div>

          {/* RSVP Status Field */}
          <div>
            <label
              htmlFor="rsvpStatus"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Initial RSVP Status
            </label>
            <div className="relative">
              <select
                id="rsvpStatus"
                value={form.rsvpStatus}
                onChange={(e) =>
                  handleInputChange("rsvpStatus", e.target.value as RsvpStatus)
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
