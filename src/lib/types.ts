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
  name: string;
  qrCode: string;
  eventDate: Date;
  venue: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RsvpStatus = "pending" | "confirmed" | "declined" | "rescinded";

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
  variant?: "primary" | "secondary" | "danger" | "attendly";
  size?: "sm" | "md" | "lg" | "custom";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  // Custom styling props for attendly variant
  width?: string | number;
  height?: string | number;
  fontSize?: string | number;
  fontWeight?: string | number;
  borderRadius?: string | number;
  backgroundColor?: string;
  textColor?: string;
}

// Invite page types
export interface InvitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export interface InviteDetails extends WeddingInvitation {
  plusOne?: number;
}

// Admin dashboard types
export interface DashboardMetrics {
  totalInvitations: number;
  pendingCount: number;
  confirmedCount: number;
  rescindedCount: number;
}

export interface StatusUpdate {
  id: string;
  name: string;
  status: RsvpStatus;
  timestamp: Date;
}

export interface InvitationTableEntry {
  id: string;
  name: string;
  status: RsvpStatus;
  createdAt: Date;
  qrCode: string;
}

// Invitation form types
export interface CreateInviteForm {
  name: string;
  eventDate: string;
  venue: string;
  status: RsvpStatus;
  plusOne: number;
}

export interface EditInviteForm extends CreateInviteForm {
  id: string;
}

// Admin metrics interface
export interface AdminMetrics {
  totalInvitations: number;
  confirmedRsvps: number;
  pendingRsvps: number;
  declinedRsvps: number;
  attendanceRate: number;
}
