import type { Inquiry } from '../types';
import { MOCK_PROPERTIES } from '../../property/mockData/properties';

const now = Date.now();
const days = (n: number) => new Date(now - n * 86400000).toISOString();

export const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 'i1',
    propertyId: 'p1',
    propertyTitle: MOCK_PROPERTIES[0].title,
    propertyImage: MOCK_PROPERTIES[0].images[0],
    propertyLocation: `${MOCK_PROPERTIES[0].locality}, ${MOCK_PROPERTIES[0].city}`,
    fullName: 'Saurabh Singh',
    email: 'saurabhsinghgkp64@gmail.com',
    phone: '9876543210',
    message: 'Interested in 5 BHK with garden view. Please share floor plans.',
    status: 'visit_scheduled',
    advisorName: 'Priya Mehta',
    createdAt: days(8),
    updatedAt: days(1),
    events: [
      { id: 'e1', status: 'new', title: 'Inquiry submitted', description: 'Your inquiry has been received', timestamp: days(8) },
      { id: 'e2', status: 'contacted', title: 'Advisor reached out', description: 'Priya Mehta contacted you', timestamp: days(7) },
      { id: 'e3', status: 'in_progress', title: 'Details shared', description: 'Floor plans and brochure sent', timestamp: days(5) },
      { id: 'e4', status: 'visit_scheduled', title: 'Site visit scheduled', description: 'Visit booked for tomorrow at 11:00 AM', timestamp: days(1) },
    ],
  },
  {
    id: 'i2',
    propertyId: 'p4',
    propertyTitle: MOCK_PROPERTIES[3].title,
    propertyImage: MOCK_PROPERTIES[3].images[0],
    propertyLocation: `${MOCK_PROPERTIES[3].locality}, ${MOCK_PROPERTIES[3].city}`,
    fullName: 'Saurabh Singh',
    email: 'saurabhsinghgkp64@gmail.com',
    phone: '9876543210',
    message: 'Looking for 4 BHK villa. What are payment plans?',
    status: 'in_progress',
    advisorName: 'Rohan Sharma',
    createdAt: days(4),
    updatedAt: days(2),
    events: [
      { id: 'e1', status: 'new', title: 'Inquiry submitted', timestamp: days(4) },
      { id: 'e2', status: 'contacted', title: 'Advisor reached out', description: 'Rohan Sharma contacted you', timestamp: days(3) },
      { id: 'e3', status: 'in_progress', title: 'Discussion ongoing', description: 'Reviewing payment plans', timestamp: days(2) },
    ],
  },
  {
    id: 'i3',
    propertyId: 'p7',
    propertyTitle: MOCK_PROPERTIES[6].title,
    propertyImage: MOCK_PROPERTIES[6].images[0],
    propertyLocation: `${MOCK_PROPERTIES[6].locality}, ${MOCK_PROPERTIES[6].city}`,
    fullName: 'Saurabh Singh',
    email: 'saurabhsinghgkp64@gmail.com',
    phone: '9876543210',
    status: 'contacted',
    advisorName: 'Anjali Verma',
    createdAt: days(2),
    updatedAt: days(1),
    events: [
      { id: 'e1', status: 'new', title: 'Inquiry submitted', timestamp: days(2) },
      { id: 'e2', status: 'contacted', title: 'Advisor reached out', description: 'Anjali Verma contacted you', timestamp: days(1) },
    ],
  },
];
