export type VisitStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
export type VisitMode = 'in_person' | 'virtual';

export interface Visit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  date: string;
  timeSlot: string;
  status: VisitStatus;
  mode: VisitMode;
  advisorName: string;
  notes?: string;
  createdAt: string;
}
