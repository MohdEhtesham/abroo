import type { PossessionStatus, PropertyType } from '../../property/types';

export type ListingStatus = 'draft' | 'live' | 'sold' | 'paused' | 'review';

export interface SellerListing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  locality: string;
  address: string;
  priceMin: number;
  priceMax: number;
  pricePerSqft: number;
  configuration: string[];
  areaMin: number;
  areaMax: number;
  totalUnits?: number;
  possessionStatus: PossessionStatus;
  possessionDate: string;
  reraId?: string;
  amenityIds: string[];
  images: string[];
  status: ListingStatus;
  views: number;
  inquiries: number;
  callbackRequests: number;
  saves: number;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'visit_booked' | 'closed_won' | 'closed_lost';

export interface SellerLead {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  consumerName: string;
  consumerPhone: string;
  consumerEmail: string;
  message?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SellerAnalytics {
  totalViews: number;
  totalInquiries: number;
  totalCallbacks: number;
  totalSaves: number;
  conversionRate: number;
  weeklyViews: number[];
  topListings: { id: string; title: string; views: number; inquiries: number }[];
}

export interface ListingDraft {
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  locality: string;
  address: string;
  priceMin: number;
  priceMax: number;
  pricePerSqft: number;
  configuration: string[];
  areaMin: number;
  areaMax: number;
  possessionStatus: PossessionStatus;
  possessionDate: string;
  reraId?: string;
  amenityIds: string[];
  images: string[];
}
