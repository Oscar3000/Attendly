"use client";

import { useState, useEffect, use } from "react";
import { EditInviteForm, RsvpStatus, InvitationTableEntry } from "@/lib/types";
import { Button } from "@/components/button";

interface EditInvitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditInvitePage({ params }: EditInvitePageProps) {
  const resolvedParams = use(params) as { id: string };
  const [form, setForm] = useState<EditInviteForm>({
    id: resolvedParams.id,
    name: "",
    numberOfGuests: 1,
    status: "pending",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data based on ID
        const mockInvitation: InvitationTableEntry = {
          id: resolvedParams.id,
          name: "John Smith",
          status: "pending",
          email: "john@example.com",
          createdAt: new Date(),
        };

        setForm({
          id: mockInvitation.id,
          name: mockInvitation.name,
          numberOfGuests: 2, // Mock number of guests
          status: mockInvitation.status,
        });
      } catch (err) {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Updating invite:", form);

      // Redirect back to admin dashboard
      window.location.href = "/admin";
    } catch (error) {
      console.error("Error updating invite:", error);
      setError("Failed to update invitation");
    } finally {
      setIsSubmitting(false);
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
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/admin")}
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

          {/* Number of Guests Field */}
          <div>
            <label
              htmlFor="numberOfGuests"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Number of guests
            </label>
            <input
              type="number"
              id="numberOfGuests"
              value={form.numberOfGuests}
              onChange={(e) =>
                handleInputChange(
                  "numberOfGuests",
                  parseInt(e.target.value) || 1,
                )
              }
              placeholder="Enter number"
              min="1"
              max="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                fontFamily: "Inter",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Invite Status Field */}
          <div>
            <label
              htmlFor="status"
              className="block text-lg font-medium text-gray-900 mb-3"
            >
              Invite Status
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
