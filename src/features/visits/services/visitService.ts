import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiGet, apiPost, apiPut } from '../../../services/apiClient';
import { MOCK_VISITS } from '../mockData/visits';
import type { Visit, VisitMode } from '../types';

let store: Visit[] = [...MOCK_VISITS];

const SLOTS = [
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
];

interface CreateInput {
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  date: string;
  timeSlot: string;
  mode: VisitMode;
  advisorName?: string;
  notes?: string;
}

const mock = {
  list: (): Promise<Visit[]> =>
    mockResponse(
      [...store].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
      600,
    ),
  detail: (id: string) => mockResponse(store.find(v => v.id === id) ?? null, 400),
  slots: () => mockResponse(SLOTS, 200),
  create: async (input: CreateInput): Promise<Visit> => {
    const visit: Visit = {
      id: `v${Date.now()}`,
      status: 'upcoming',
      advisorName: input.advisorName ?? 'Priya Mehta',
      createdAt: new Date().toISOString(),
      ...input,
    };
    store = [visit, ...store];
    return mockResponse(visit, 800);
  },
  cancel: async (id: string) => {
    store = store.map(v => (v.id === id ? { ...v, status: 'cancelled' } : v));
    return mockResponse({ success: true }, 500);
  },
};

const real = {
  list: () => apiGet<Visit[]>('/visits'),
  detail: (id: string) => apiGet<Visit | null>(`/visits/${id}`),
  slots: () => apiGet<string[]>('/visits/slots'),
  create: (input: CreateInput) => apiPost<Visit>('/visits', input),
  cancel: (id: string) => apiPut<{ success: boolean }>(`/visits/${id}/cancel`),
  reschedule: (id: string, date: string, timeSlot: string) =>
    apiPut<Visit>(`/visits/${id}/reschedule`, { date, timeSlot }),
};

export const visitService = USE_MOCK ? mock : real;
