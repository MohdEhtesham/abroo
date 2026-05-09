import type { Visit } from '../types';
import { MOCK_PROPERTIES } from '../../property/mockData/properties';

const now = Date.now();
const days = (n: number) => new Date(now + n * 86400000).toISOString();

export const MOCK_VISITS: Visit[] = [
  {
    id: 'v1',
    propertyId: 'p1',
    propertyTitle: MOCK_PROPERTIES[0].title,
    propertyImage: MOCK_PROPERTIES[0].images[0],
    propertyLocation: `${MOCK_PROPERTIES[0].locality}, ${MOCK_PROPERTIES[0].city}`,
    date: days(1),
    timeSlot: '11:00 AM - 12:00 PM',
    status: 'upcoming',
    mode: 'in_person',
    advisorName: 'Priya Mehta',
    notes: 'Bring ID proof for security verification.',
    createdAt: days(-2),
  },
  {
    id: 'v2',
    propertyId: 'p4',
    propertyTitle: MOCK_PROPERTIES[3].title,
    propertyImage: MOCK_PROPERTIES[3].images[0],
    propertyLocation: `${MOCK_PROPERTIES[3].locality}, ${MOCK_PROPERTIES[3].city}`,
    date: days(4),
    timeSlot: '4:00 PM - 5:00 PM',
    status: 'upcoming',
    mode: 'virtual',
    advisorName: 'Rohan Sharma',
    createdAt: days(-1),
  },
  {
    id: 'v3',
    propertyId: 'p7',
    propertyTitle: MOCK_PROPERTIES[6].title,
    propertyImage: MOCK_PROPERTIES[6].images[0],
    propertyLocation: `${MOCK_PROPERTIES[6].locality}, ${MOCK_PROPERTIES[6].city}`,
    date: days(-7),
    timeSlot: '10:30 AM - 11:30 AM',
    status: 'completed',
    mode: 'in_person',
    advisorName: 'Anjali Verma',
    notes: 'Visit completed. Sample apartment shown.',
    createdAt: days(-14),
  },
  {
    id: 'v4',
    propertyId: 'p9',
    propertyTitle: MOCK_PROPERTIES[8].title,
    propertyImage: MOCK_PROPERTIES[8].images[0],
    propertyLocation: `${MOCK_PROPERTIES[8].locality}, ${MOCK_PROPERTIES[8].city}`,
    date: days(-12),
    timeSlot: '3:00 PM - 4:00 PM',
    status: 'cancelled',
    mode: 'in_person',
    advisorName: 'Vikram Joshi',
    createdAt: days(-18),
  },
];
