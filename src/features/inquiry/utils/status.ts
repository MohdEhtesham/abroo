import type { InquiryStatus } from '../types';

export const statusMeta = (
  status: InquiryStatus,
): { label: string; tone: 'info' | 'warning' | 'success' | 'accent' | 'neutral' } => {
  switch (status) {
    case 'new':
      return { label: 'New', tone: 'info' };
    case 'contacted':
      return { label: 'Contacted', tone: 'warning' };
    case 'in_progress':
      return { label: 'In Progress', tone: 'accent' };
    case 'visit_scheduled':
      return { label: 'Visit Scheduled', tone: 'success' };
    case 'closed':
      return { label: 'Closed', tone: 'neutral' };
  }
};
