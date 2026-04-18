import { API_BASE_URL } from '@/config/constants';
import type { ApiResponse, Material, PaginatedResult, Review, Bookmark, Download, Report, User } from '@/types';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const apiService = {
  // Auth
  async signup(data: { name: string; email: string; password: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<{ token: string; user: User }>>;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<{ token: string; user: User }>>;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<User>>;
  },

  async updateProfile(data: Partial<User>) {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<User>>;
  },

  // Materials
  async getMaterials(params: {
    search?: string;
    type?: string;
    department?: string;
    minRating?: number;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.set(k, String(v)); });
    const res = await fetch(`${API_BASE_URL}/api/materials?${query}`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<PaginatedResult<Material>>>;
  },

  async getTrending() {
    const res = await fetch(`${API_BASE_URL}/api/materials/trending`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Material[]>>;
  },

  async getMaterial(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Material>>;
  },

  async createMaterial(data: Partial<Material>) {
    const res = await fetch(`${API_BASE_URL}/api/materials`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<Material>>;
  },

  async deleteMaterial(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json() as Promise<ApiResponse<null>>;
  },

  async downloadMaterial(id: number) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${id}/download`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json() as Promise<ApiResponse<{ fileUrl: string | null }>>;
  },

  // Reviews
  async getReviews(materialId: number) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${materialId}/reviews`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Review[]>>;
  },

  async createReview(materialId: number, data: { rating: number; comment?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${materialId}/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<Review>>;
  },

  // Bookmarks
  async getBookmarks() {
    const res = await fetch(`${API_BASE_URL}/api/materials/user/bookmarks`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Bookmark[]>>;
  },

  async toggleBookmark(materialId: number) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${materialId}/bookmark`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json() as Promise<ApiResponse<{ bookmarked: boolean }>>;
  },

  // Downloads history
  async getDownloadHistory() {
    const res = await fetch(`${API_BASE_URL}/api/materials/user/downloads`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Download[]>>;
  },

  // My uploads
  async getMyUploads() {
    const res = await fetch(`${API_BASE_URL}/api/materials/user/uploads`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Material[]>>;
  },

  // Report
  async reportMaterial(materialId: number, data: { reason: string; description?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/materials/${materialId}/report`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return res.json() as Promise<ApiResponse<Report>>;
  },

  // Admin
  async getAdminFlagged() {
    const res = await fetch(`${API_BASE_URL}/api/admin/flagged`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Material[]>>;
  },

  async getAdminPending() {
    const res = await fetch(`${API_BASE_URL}/api/admin/pending`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Material[]>>;
  },

  async getAdminReports() {
    const res = await fetch(`${API_BASE_URL}/api/admin/reports`, { headers: authHeaders() });
    return res.json() as Promise<ApiResponse<Report[]>>;
  },

  async updateMaterialStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/materials/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json() as Promise<ApiResponse<Material>>;
  },

  async updateReportStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json() as Promise<ApiResponse<Report>>;
  },
};
