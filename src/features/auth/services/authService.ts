import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/apiClient';
import type { User } from '../types';

const sampleUser: User = {
  id: 'u1',
  fullName: 'Saurabh Singh',
  email: 'saurabhsinghgkp64@gmail.com',
  phone: '9876543210',
  avatar: 'https://i.pravatar.cc/300?img=12',
  city: 'Gurgaon',
  role: 'consumer',
  preferences: {
    budgetMin: 5000000,
    budgetMax: 30000000,
    preferredCities: ['Gurgaon', 'Noida'],
    preferredTypes: ['apartment', 'villa'],
    preferredConfigs: ['3 BHK', '4 BHK'],
    notificationsEnabled: true,
  },
  seller: {
    plan: 'free',
    listingQuotaUsed: 0,
    listingQuotaTotal: 1,
    totalLeads: 0,
    rating: 0,
  },
  createdAt: new Date().toISOString(),
};

interface AuthResponse {
  user: User;
  token: string;
}

const mock = {
  login: (
    _identifier: string,
    _password: string,
    role: 'consumer' | 'seller' = 'consumer',
  ): Promise<AuthResponse> =>
    mockResponse({ user: { ...sampleUser, role }, token: 'mock-jwt-token' }, 900),

  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'consumer' | 'seller';
  }): Promise<AuthResponse> =>
    mockResponse(
      {
        user: {
          ...sampleUser,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: data.role ?? 'consumer',
        },
        token: 'mock-jwt-token',
      },
      900,
    ),

  sendOtp: (_phone: string) => mockResponse({ sent: true, otp: '1234' }, 700),

  verifyOtp: (
    _phone: string,
    otp: string,
    role: 'consumer' | 'seller' = 'consumer',
  ): Promise<{ valid: boolean; user: User; token: string }> =>
    mockResponse(
      { valid: otp === '1234', user: { ...sampleUser, role }, token: 'mock-jwt-token' },
      700,
    ),

  forgotPassword: (_identifier: string) => mockResponse({ sent: true }, 700),

  me: (): Promise<User> => mockResponse(sampleUser, 400),

  logout: () => mockResponse({ success: true }, 300),

  updateProfile: (data: Partial<User>): Promise<User> =>
    mockResponse({ ...sampleUser, ...data }, 600),

  deleteAccount: () => mockResponse({ success: true }, 600),

  // Mock: just stores the local URI directly. Works for demo / offline.
  uploadAvatar: (localUri: string): Promise<User> =>
    mockResponse({ ...sampleUser, avatar: localUri }, 500),
};

const real = {
  login: (identifier: string, password: string, role: 'consumer' | 'seller' = 'consumer') =>
    apiPost<AuthResponse>('/auth/login', { identifier, password, role }),

  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'consumer' | 'seller';
  }) => apiPost<AuthResponse>('/auth/signup', data),

  sendOtp: (phone: string) =>
    apiPost<{ sent: boolean; otp?: string }>('/auth/otp/send', { phone }),

  verifyOtp: (phone: string, otp: string, role: 'consumer' | 'seller' = 'consumer') =>
    apiPost<{ valid: boolean; user: User; token: string }>('/auth/otp/verify', { phone, otp, role }),

  forgotPassword: (identifier: string) =>
    apiPost<{ sent: boolean }>('/auth/forgot-password', { identifier }),

  me: () => apiGet<User>('/auth/me'),

  logout: () => apiPost<{ success: boolean }>('/auth/logout'),

  updateProfile: (data: Partial<User>) => apiPut<User>('/auth/profile', data),

  deleteAccount: () => apiDelete<{ success: boolean }>('/auth/me'),

  /**
   * Two-step flow for the real backend:
   *  1. Upload the local image to Cloudinary via /api/uploads/single
   *  2. PUT the returned URL onto the user profile
   *
   * If the server has Cloudinary disabled (env vars missing), the upload
   * returns 503 — we surface a friendly error and the caller falls back to
   * the local URI for the immediate UI update.
   */
  uploadAvatar: async (localUri: string): Promise<User> => {
    const form = new FormData();
    // Best-effort filename + mime — react-native-image-picker URIs are usually
    // .jpg from the camera and varying from gallery
    const filename = localUri.split('/').pop() || `avatar-${Date.now()}.jpg`;
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('file', {
      uri: localUri,
      name: filename,
      type: mime,
    } as any);

    const uploaded = await apiPost<{ url: string; publicId: string }>(
      '/uploads/single',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Don't auto-retry uploads — they're large and not idempotent
        ...({ noRetry: true } as any),
      },
    );
    if (!uploaded?.url) throw new Error('Upload returned no URL');

    return apiPut<User>('/auth/profile', { avatar: uploaded.url });
  },
};

export const authService = USE_MOCK ? mock : real;
