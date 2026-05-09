import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { sellerService } from '../../features/seller/services/sellerService';
import type {
  LeadStatus,
  ListingStatus,
  SellerAnalytics,
  SellerLead,
  SellerListing,
  SellerVisit,
  SellerVisitStatus,
} from '../../features/seller/types';

interface SellerState {
  listings: SellerListing[];
  leads: SellerLead[];
  visits: SellerVisit[];
  analytics: SellerAnalytics | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: SellerState = {
  listings: [],
  leads: [],
  visits: [],
  analytics: null,
  loading: false,
  submitting: false,
  error: null,
};

export const loadListingsThunk = createAsyncThunk('seller/loadListings', () =>
  sellerService.listings(),
);

export const createListingThunk = createAsyncThunk(
  'seller/createListing',
  async (input: { draft: Parameters<typeof sellerService.createListing>[0]; ownerId: string }) =>
    sellerService.createListing(input.draft, input.ownerId),
);

export const setListingStatusThunk = createAsyncThunk(
  'seller/setListingStatus',
  async (input: { id: string; status: ListingStatus }) =>
    sellerService.setStatus(input.id, input.status),
);

export const deleteListingThunk = createAsyncThunk(
  'seller/deleteListing',
  async (id: string) => {
    await sellerService.deleteListing(id);
    return id;
  },
);

export const loadLeadsThunk = createAsyncThunk('seller/loadLeads', () =>
  sellerService.leads(),
);

export const setLeadStatusThunk = createAsyncThunk(
  'seller/setLeadStatus',
  async (input: { id: string; status: LeadStatus }) =>
    sellerService.setLeadStatus(input.id, input.status),
);

export const loadAnalyticsThunk = createAsyncThunk('seller/loadAnalytics', () =>
  sellerService.analytics(),
);

export const loadSellerVisitsThunk = createAsyncThunk('seller/loadVisits', () =>
  sellerService.visits(),
);

export const setSellerVisitStatusThunk = createAsyncThunk(
  'seller/setVisitStatus',
  async (input: { id: string; status: SellerVisitStatus }) =>
    sellerService.setVisitStatus(input.id, input.status),
);

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadListingsThunk.pending, s => {
        s.loading = true;
      })
      .addCase(loadListingsThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.listings = a.payload;
      })
      .addCase(loadListingsThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createListingThunk.pending, s => {
        s.submitting = true;
      })
      .addCase(createListingThunk.fulfilled, (s, a) => {
        s.submitting = false;
        s.listings = [a.payload, ...s.listings];
      })
      .addCase(createListingThunk.rejected, (s, a) => {
        s.submitting = false;
        s.error = a.error.message ?? null;
      })
      .addCase(setListingStatusThunk.fulfilled, (s, a) => {
        if (a.payload) {
          s.listings = s.listings.map(l => (l.id === a.payload!.id ? a.payload! : l));
        }
      })
      .addCase(deleteListingThunk.fulfilled, (s, a) => {
        s.listings = s.listings.filter(l => l.id !== a.payload);
      })
      .addCase(loadLeadsThunk.pending, s => {
        s.loading = true;
      })
      .addCase(loadLeadsThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.leads = a.payload;
      })
      .addCase(setLeadStatusThunk.fulfilled, (s, a) => {
        if (a.payload) {
          s.leads = s.leads.map(l => (l.id === a.payload!.id ? a.payload! : l));
        }
      })
      .addCase(loadAnalyticsThunk.fulfilled, (s, a) => {
        s.analytics = a.payload;
      })
      .addCase(loadSellerVisitsThunk.fulfilled, (s, a) => {
        s.visits = a.payload;
      })
      .addCase(setSellerVisitStatusThunk.fulfilled, (s, a) => {
        if (a.payload) {
          s.visits = s.visits.map(v => (v.id === a.payload!.id ? a.payload! : v));
        }
      });
  },
});

export default sellerSlice.reducer;
