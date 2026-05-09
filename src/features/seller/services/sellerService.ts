import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/apiClient';
import { MOCK_SELLER_LEADS } from '../mockData/leads';
import { MOCK_SELLER_LISTINGS } from '../mockData/listings';
import type {
  ListingDraft,
  ListingStatus,
  LeadStatus,
  SellerAnalytics,
  SellerLead,
  SellerListing,
  SellerVisit,
  SellerVisitStatus,
} from '../types';

let listings: SellerListing[] = [...MOCK_SELLER_LISTINGS];
let leads: SellerLead[] = [...MOCK_SELLER_LEADS];

const computeAnalytics = (): SellerAnalytics => {
  const totalViews = listings.reduce((s, l) => s + l.views, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiries, 0);
  const totalCallbacks = listings.reduce((s, l) => s + l.callbackRequests, 0);
  const totalSaves = listings.reduce((s, l) => s + l.saves, 0);
  const conv = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;
  const weekly = Array.from({ length: 7 }, () => Math.floor(Math.random() * 220) + 60);
  const top = [...listings]
    .filter(l => l.status === 'live')
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(l => ({ id: l.id, title: l.title, views: l.views, inquiries: l.inquiries }));
  return {
    totalViews,
    totalInquiries,
    totalCallbacks,
    totalSaves,
    conversionRate: Math.round(conv * 10) / 10,
    weeklyViews: weekly,
    topListings: top,
  };
};

const mock = {
  listings: () =>
    mockResponse(
      [...listings].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
      500,
    ),
  listing: (id: string) => mockResponse(listings.find(l => l.id === id) ?? null, 300),
  createListing: async (draft: ListingDraft, ownerId: string) => {
    const now = new Date().toISOString();
    const newListing: SellerListing = {
      id: `sl${Date.now()}`,
      ownerId,
      ...draft,
      status: 'live',
      views: 0,
      inquiries: 0,
      callbackRequests: 0,
      saves: 0,
      createdAt: now,
      updatedAt: now,
    };
    listings = [newListing, ...listings];
    return mockResponse(newListing, 800);
  },
  updateListing: async (id: string, patch: Partial<SellerListing>) => {
    listings = listings.map(l =>
      l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l,
    );
    return mockResponse(listings.find(l => l.id === id) ?? null, 400);
  },
  setStatus: async (id: string, status: ListingStatus) => {
    listings = listings.map(l =>
      l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l,
    );
    return mockResponse(listings.find(l => l.id === id) ?? null, 300);
  },
  deleteListing: async (id: string) => {
    listings = listings.filter(l => l.id !== id);
    return mockResponse({ success: true }, 300);
  },
  leads: () =>
    mockResponse(
      [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      500,
    ),
  setLeadStatus: async (id: string, status: LeadStatus) => {
    leads = leads.map(l =>
      l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l,
    );
    return mockResponse(leads.find(l => l.id === id) ?? null, 200);
  },
  analytics: () => mockResponse(computeAnalytics(), 600),
  // Mock visits view: empty by default — production data will fill this in
  // through the real backend endpoint. Sellers in mock mode just see no
  // bookings yet, which matches the typical onboarding experience.
  visits: (): Promise<SellerVisit[]> => mockResponse([], 200),
  setVisitStatus: async (
    _id: string,
    _status: SellerVisitStatus,
  ): Promise<SellerVisit | null> => mockResponse(null as SellerVisit | null, 200),
};

const real = {
  listings: () => apiGet<SellerListing[]>('/seller/listings'),
  listing: (id: string) => apiGet<SellerListing | null>(`/seller/listings/${id}`),
  createListing: (draft: ListingDraft, _ownerId: string) =>
    apiPost<SellerListing>('/seller/listings', draft),
  updateListing: (id: string, patch: Partial<SellerListing>) =>
    apiPut<SellerListing | null>(`/seller/listings/${id}`, patch),
  setStatus: (id: string, status: ListingStatus) =>
    apiPut<SellerListing | null>(`/seller/listings/${id}/status`, { status }),
  deleteListing: (id: string) => apiDelete<{ success: boolean }>(`/seller/listings/${id}`),
  leads: () => apiGet<SellerLead[]>('/seller/leads'),
  setLeadStatus: (id: string, status: LeadStatus) =>
    apiPut<SellerLead | null>(`/seller/leads/${id}/status`, { status }),
  analytics: () => apiGet<SellerAnalytics>('/seller/analytics'),
  visits: () => apiGet<SellerVisit[]>('/seller/visits'),
  setVisitStatus: (id: string, status: SellerVisitStatus) =>
    apiPut<SellerVisit | null>(`/seller/visits/${id}/status`, { status }),
};

export const sellerService = USE_MOCK ? mock : real;
