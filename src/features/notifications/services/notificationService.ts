import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiGet, apiPut } from '../../../services/apiClient';
import { MOCK_NOTIFICATIONS } from '../mockData/notifications';
import type { AppNotification } from '../types';

let store: AppNotification[] = [...MOCK_NOTIFICATIONS];

const mock = {
  list: (): Promise<AppNotification[]> => mockResponse([...store], 500),
  markRead: async (id: string) => {
    store = store.map(n => (n.id === id ? { ...n, read: true } : n));
    return mockResponse({ success: true }, 200);
  },
  markAllRead: async () => {
    store = store.map(n => ({ ...n, read: true }));
    return mockResponse({ success: true }, 300);
  },
  unreadCount: () => mockResponse(store.filter(n => !n.read).length, 100),
};

const real = {
  list: () => apiGet<AppNotification[]>('/notifications'),
  markRead: (id: string) => apiPut<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => apiPut<{ success: boolean }>('/notifications/read-all'),
  unreadCount: () => apiGet<number>('/notifications/unread-count'),
};

export const notificationService = USE_MOCK ? mock : real;
