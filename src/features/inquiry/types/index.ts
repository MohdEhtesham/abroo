export type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'visit_scheduled' | 'closed';

export interface InquiryStatusEvent {
  id: string;
  status: InquiryStatus;
  title: string;
  description?: string;
  timestamp: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
  status: InquiryStatus;
  advisorName?: string;
  createdAt: string;
  updatedAt: string;
  events: InquiryStatusEvent[];
}
