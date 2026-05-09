export const APP_NAME = 'Aabroo';
export const APP_TAGLINE = 'Discover your dream home';
export const COMPANY = 'Aabroo';
export const SUPPORT_EMAIL = 'support@aabroo.com';
export const SUPPORT_PHONE = '+91 99999 99999';

export const CITIES = [
  'Gurgaon',
  'Noida',
  'Mumbai',
  'Bangalore',
  'Ahmedabad',
  'Pune',
  'Hyderabad',
  'Chennai',
];

export const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'business' },
  { id: 'villa', label: 'Villa', icon: 'home' },
  { id: 'plot', label: 'Plot', icon: 'map' },
  { id: 'commercial', label: 'Commercial', icon: 'briefcase' },
  { id: 'penthouse', label: 'Penthouse', icon: 'star' },
  { id: 'studio', label: 'Studio', icon: 'cube' },
];

export const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

export const BUDGET_RANGES = [
  { id: 'b1', label: 'Under ₹50L', min: 0, max: 5000000 },
  { id: 'b2', label: '₹50L - ₹1Cr', min: 5000000, max: 10000000 },
  { id: 'b3', label: '₹1Cr - ₹2Cr', min: 10000000, max: 20000000 },
  { id: 'b4', label: '₹2Cr - ₹5Cr', min: 20000000, max: 50000000 },
  { id: 'b5', label: '₹5Cr+', min: 50000000, max: 999999999 },
];

export const POSSESSION_STATUS = [
  'Ready to Move',
  'Under Construction',
  'New Launch',
];

export const INQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  IN_PROGRESS: 'in_progress',
  VISIT_SCHEDULED: 'visit_scheduled',
  CLOSED: 'closed',
} as const;

export const VISIT_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;
