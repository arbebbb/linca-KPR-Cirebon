/**
 * LINCA Dashboard - API Service Layer
 */

import type {
  Application,
  ApplicationFormData,
  ApplicationsResponse,
  SearchResponse,
  PublicApplication,
  StatsItem,
  FilterOptions,
  StagingItem,
  ApplicationFilters,
  LoginCredentials,
  LoginResponse,
  TokenVerifyResponse,
} from './types';

// API Base URL - Update this to match your deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fire.vadr.my.id/linca';

// API Endpoints
const ADMIN_APPLICATIONS_ENDPOINT = '/applications.php';
const PUBLIC_APPLICATIONS_ENDPOINT = '/applications_public.php';
const STAGINGS_ENDPOINT = '/stagings.php';

// Token storage key
const TOKEN_KEY = 'linca_auth_token';

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set auth token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove auth token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * API fetch wrapper with auth handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle CSV export
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response.text() as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// ============================================
// AUTH API
// ============================================

/**
 * Login admin
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>('/admin.php?action=login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  if (response.token) {
    setToken(response.token);
  }
  
  return response;
}

/**
 * Verify current token
 */
export async function verifyToken(): Promise<TokenVerifyResponse> {
  return apiFetch<TokenVerifyResponse>('/admin.php?action=verify');
}

/**
 * Logout (clear token)
 */
export function logout(): void {
  removeToken();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============================================
// APPLICATIONS API
// ============================================

/**
 * Get all applications with filters
 */
export async function getApplications(
  filters: ApplicationFilters = {}
): Promise<ApplicationsResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  const endpoint = `${ADMIN_APPLICATIONS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch<ApplicationsResponse>(endpoint);
}

/**
 * Get single application by ID
 */
export async function getApplication(id: number): Promise<Application> {
  return apiFetch<Application>(`${ADMIN_APPLICATIONS_ENDPOINT}?id=${id}`);
}

/**
 * Search applications by name (public)
 */
export async function searchApplications(name: string): Promise<SearchResponse<PublicApplication>> {
  return apiFetch<SearchResponse<PublicApplication>>(`${PUBLIC_APPLICATIONS_ENDPOINT}?search=${encodeURIComponent(name)}`);
}

/**
 * Get application statistics
 */
export async function getStats(): Promise<StatsItem[]> {
  return apiFetch<StatsItem[]>(`${ADMIN_APPLICATIONS_ENDPOINT}?stats=true`);
}

/**
 * Get filter options (unique values)
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  return apiFetch<FilterOptions>(`${ADMIN_APPLICATIONS_ENDPOINT}?filters=true`);
}

// ============================================
// STAGINGS API
// ============================================

export async function getStagings(): Promise<StagingItem[]> {
  return apiFetch<StagingItem[]>(STAGINGS_ENDPOINT);
}

export async function createStaging(data: { name: string; description?: string | null }): Promise<StagingItem> {
  return apiFetch<StagingItem>(STAGINGS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStaging(
  id: number,
  data: { name: string; description?: string | null }
): Promise<StagingItem> {
  return apiFetch<StagingItem>(`${STAGINGS_ENDPOINT}?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStaging(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${STAGINGS_ENDPOINT}?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Create new application (auth required)
 */
export async function createApplication(
  data: ApplicationFormData
): Promise<Application> {
  return apiFetch<Application>(ADMIN_APPLICATIONS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update application (auth required)
 */
export async function updateApplication(
  id: number,
  data: ApplicationFormData
): Promise<Application> {
  return apiFetch<Application>(`${ADMIN_APPLICATIONS_ENDPOINT}?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete application (auth required)
 */
export async function deleteApplication(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${ADMIN_APPLICATIONS_ENDPOINT}?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Export applications to CSV
 */
export async function exportToCSV(filters: ApplicationFilters = {}): Promise<void> {
  const params = new URLSearchParams({ export: 'csv' });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}${ADMIN_APPLICATIONS_ENDPOINT}?${params.toString()}`;
  
  // Open in new window to trigger download
  window.open(url, '_blank');
}

/**
 * Download CSV as blob
 */
export async function downloadCSV(filters: ApplicationFilters = {}): Promise<Blob> {
  const params = new URLSearchParams({ export: 'csv' });
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}${ADMIN_APPLICATIONS_ENDPOINT}?${params.toString()}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to export data');
  }
  
  return response.blob();
}
