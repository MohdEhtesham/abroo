import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiGet, apiPost } from '../../../services/apiClient';
import { MOCK_INQUIRIES } from '../mockData/inquiries';
import type { Inquiry } from '../types';

let store: Inquiry[] = [...MOCK_INQUIRIES];

interface CreateInput {
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
}

const mock = {
  list: (): Promise<Inquiry[]> =>
    mockResponse(
      [...store].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
      600,
    ),
  detail: (id: string) => mockResponse(store.find(i => i.id === id) ?? null, 400),
  create: async (input: CreateInput): Promise<Inquiry> => {
    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      id: `i${Date.now()}`,
      ...input,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      events: [
        { id: 'e1', status: 'new', title: 'Inquiry submitted', description: 'Your inquiry has been received', timestamp: now },
      ],
    };
    store = [inquiry, ...store];
    return mockResponse(inquiry, 800);
  },
};

const real = {
  list: () => apiGet<Inquiry[]>('/inquiries'),
  detail: (id: string) => apiGet<Inquiry | null>(`/inquiries/${id}`),
  create: (input: CreateInput) => apiPost<Inquiry>('/inquiries', input),
};

export const inquiryService = USE_MOCK ? mock : real;
