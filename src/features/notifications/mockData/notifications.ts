import type { AppNotification } from '../types';

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60000).toISOString();

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'visit_reminder',
    title: 'Site visit tomorrow',
    body: 'Your site visit at DLF The Camellias is tomorrow at 11:00 AM. Tap to view details.',
    read: false,
    createdAt: ago(15),
    actionId: 'v1',
  },
  {
    id: 'n2',
    type: 'inquiry_update',
    title: 'Advisor assigned',
    body: 'Priya Mehta has been assigned as your dedicated advisor for DLF The Camellias.',
    read: false,
    createdAt: ago(180),
    actionId: 'i1',
  },
  {
    id: 'n3',
    type: 'price_drop',
    title: 'Price drop alert',
    body: 'Sobha Royal Pavilion has launched a special offer with 5% off on selected units.',
    read: false,
    createdAt: ago(360),
    actionId: 'p6',
  },
  {
    id: 'n4',
    type: 'new_property',
    title: 'New launch in Mumbai',
    body: 'Oberoi Sky City just launched in Borivali East. Be among the first to view.',
    read: true,
    createdAt: ago(1440),
    actionId: 'p7',
  },
  {
    id: 'n5',
    type: 'message',
    title: 'New message from Rohan Sharma',
    body: 'Hi! I\'ve shared the latest payment plan for Prestige Lakeside.',
    read: true,
    createdAt: ago(2880),
    actionId: 'chat-1',
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Welcome to Aabroo',
    body: 'Discover premium properties from India\'s top builders.',
    read: true,
    createdAt: ago(10080),
  },
];
