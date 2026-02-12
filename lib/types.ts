/**
 * LINCA Dashboard - TypeScript Types
 */

// Application/Loan Progress Types
export interface Application {
  id: number;
  kocab: string | null;
  cabang: string | null;
  sales: string | null;
  no_aplikasi: string | null;
  nama_debitur: string | null;
  nama_perusahaan: string | null;
  job_type: string | null;
  limit_apl: number | null;
  limit_app: number | null;
  staging_id: number | null;
  staging: StagingStatus | null;
  cek_slik_ideb: number | null;
  produk: string | null;
  program_marketing: string | null;
  proyek: string | null;
  keterangan: string | null;
  proyeksi_booking: ProyeksiBooking | null;
  proses_sistem: string | null;
  wa_sales: string | null;
  created_at: string;
  updated_at: string;
}

// Public search result (limited fields)
export interface PublicApplication {
  id: number;
  no_aplikasi: string | null;
  nama_debitur: string | null;
  cabang: string | null;
  sales: string | null;
  staging: StagingStatus | null;
  cek_slik_ideb: number | null;
  produk: string | null;
  proyek: string | null;
  program_marketing: string | null;
  keterangan: string | null;
  proyeksi_booking: ProyeksiBooking | null;
  proses_sistem: string | null;
  wa_sales: string | null;
}

// Staging status categories
export type StagingStatus = 
  | 'Inproses' 
  | 'Approve' 
  | 'PK' 
  | 'Reject' 
  | 'Realisasi'
  | 'Onhand'
  | 'SPPK'
  | string; // Allow other values from database

// Proyeksi Booking
export type ProyeksiBooking = 'HOT' | 'WARM' | 'COLD' | string;

// Job Type
export type JobType = 
  | 'Self Employee' 
  | 'Employee (Swasta/BUMN/BUMD)' 
  | 'Profesional'
  | string;

// Form data for creating/updating application
export interface ApplicationFormData {
  kocab?: string | null;
  cabang?: string | null;
  sales?: string | null;
  no_aplikasi?: string | null;
  nama_debitur: string;
  nama_perusahaan?: string | null;
  job_type?: string | null;
  limit_apl?: number | null;
  limit_app?: number | null;
  staging_id?: number | null;
  cek_slik_ideb?: boolean | number | null;
  produk?: string | null;
  program_marketing?: string | null;
  proyek?: string | null;
  keterangan?: string | null;
  proyeksi_booking?: string | null;
  proses_sistem?: string | null;
  wa_sales?: string | null;
}

// API Response Types
export interface ApplicationsResponse {
  data: Application[];
  total: number;
  limit: number | null;
  offset: number;
}

export interface SearchResponse<T = Application> {
  data: T[];
  count: number;
}

export interface StatsItem {
  staging: string;
  count: number;
  total_limit_apl: number | null;
  total_limit_app: number | null;
}

export interface FilterOptions {
  staging: StagingItem[];
  produk: string[];
  cabang: string[];
  proyeksi_booking: string[];
}

export interface StagingItem {
  id: number;
  name: string;
  description?: string | null;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'view' | string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface TokenVerifyResponse {
  valid: boolean;
  user: AuthUser;
}

// API Error Response
export interface ApiError {
  message: string;
}

// Filter params for applications
export interface ApplicationFilters {
  staging?: string;
  staging_id?: number;
  cabang?: string;
  sales?: string;
  produk?: string;
  proyeksi_booking?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  kocab?: string;
  job_type?: string;
  program_marketing?: string;
  proyek?: string;
  nama_perusahaan?: string;
  limit?: number;
  offset?: number;
}

// Status colors mapping for UI
export const STAGING_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Inproses': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'Approve': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  'PK': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  'Reject': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'Realisasi': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Onhand': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'SPPK': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
};

export const PROYEKSI_COLORS: Record<string, { bg: string; text: string }> = {
  'HOT': { bg: 'bg-red-500', text: 'text-white' },
  'WARM': { bg: 'bg-yellow-500', text: 'text-white' },
  'COLD': { bg: 'bg-blue-500', text: 'text-white' },
};

// Helper function to get staging color
export function getStagingColor(staging: string | null) {
  if (!staging) return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  return STAGING_COLORS[staging] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
}

// Helper function to format currency (IDR)
export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);

  // Guard against invalid or non-finite dates to avoid RangeError in Intl.DateTimeFormat
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// Generate WhatsApp link
export function getWhatsAppLink(phone: string | null, message?: string): string {
  if (!phone) return '#';
  // Remove non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  const baseUrl = `https://wa.me/${cleanPhone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}
