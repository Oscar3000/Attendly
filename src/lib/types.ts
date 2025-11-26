/**
 * Type definitions for the Attendly application
 * Following TypeScript best practices with proper interfaces
 */

// User-related types
export interface User {
  readonly id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "teacher" | "student";

// Attendance-related types
export interface AttendanceRecord {
  readonly id: string;
  userId: string;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

// API response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form-related types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface LoginForm {
  email: FormField;
  password: FormField;
}

// Wedding attendance types
export interface WeddingInvitation {
  readonly id: string;
  guestName: string;
  guestEmail?: string;
  qrCode: string;
  eventDate: Date;
  venue: string;
  rsvpStatus: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RsvpStatus = "pending" | "confirmed" | "declined";

export interface QrScanResult {
  success: boolean;
  invitationId?: string;
  guestName?: string;
  error?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}