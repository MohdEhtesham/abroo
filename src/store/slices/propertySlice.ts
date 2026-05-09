import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { propertyService } from '../../features/property/services/propertyService';
import type {
  Property,
  PropertyFilters,
  SelectedLocation,
} from '../../features/property/types';

interface PropertyState {
  list: Property[];
  featured: Property[];
  trending: Property[];
  recommended: Property[];
  filters: PropertyFilters;
  /** Globally-applied location chosen by the user. Reflected into filter
   *  city + locality on every list/home fetch. */
  selectedLocation: SelectedLocation | null;
  /** Most recently picked locations — surfaced as quick-access chips
   *  inside the picker. Capped to 5. */
  recentLocations: SelectedLocation[];
  saved: string[];
  loading: boolean;
  homeLoading: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;
}

const initialState: PropertyState = {
  list: [],
  featured: [],
  trending: [],
  recommended: [],
  filters: {},
  selectedLocation: null,
  recentLocations: [],
  saved: [],
  loading: false,
  homeLoading: false,
  page: 1,
  hasMore: true,
  error: null,
};

export const loadHomeThunk = createAsyncThunk('property/loadHome', async () => {
  const [featured, trending, recommended] = await Promise.all([
    propertyService.featured(),
    propertyService.trending(),
    propertyService.recommended(),
  ]);
  return { featured, trending, recommended };
});

export const loadListThunk = createAsyncThunk(
  'property/loadList',
  async (input: { filters: PropertyFilters; page?: number; refresh?: boolean }) => {
    const res = await propertyService.list(input.filters, input.page ?? 1);
    return { ...res, refresh: input.refresh ?? false };
  },
);

export const loadSavedThunk = createAsyncThunk('property/loadSaved', async () => {
  const items = await propertyService.saved();
  return items.map(p => p.id);
});

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PropertyFilters>) => {
      state.filters = action.payload;
      state.page = 1;
      state.list = [];
      state.hasMore = true;
    },
    setLocation: (state, action: PayloadAction<SelectedLocation | null>) => {
      const loc = action.payload;
      state.selectedLocation = loc;
      // Mirror into filters so anything reading filters.city / .locality
      // (including the existing /properties API query builder) picks it up
      // immediately.
      state.filters = {
        ...state.filters,
        city: loc?.city,
        locality: loc?.locality,
      };
      state.page = 1;
      state.list = [];
      state.hasMore = true;
      if (loc) {
        // Push to recents (dedupe by city+locality, keep newest at the top, cap 5).
        const key = `${loc.city}::${loc.locality ?? ''}`;
        const filtered = state.recentLocations.filter(
          r => `${r.city}::${r.locality ?? ''}` !== key,
        );
        state.recentLocations = [loc, ...filtered].slice(0, 5);
      }
    },
    clearLocation: state => {
      state.selectedLocation = null;
      state.filters = { ...state.filters, city: undefined, locality: undefined };
      state.page = 1;
      state.list = [];
      state.hasMore = true;
    },
    clearRecentLocations: state => {
      state.recentLocations = [];
    },
    toggleSaved: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.saved.includes(id)) {
        state.saved = state.saved.filter(x => x !== id);
      } else {
        state.saved.push(id);
      }
    },
    clearList: state => {
      state.list = [];
      state.page = 1;
      state.hasMore = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadHomeThunk.pending, state => {
        state.homeLoading = true;
      })
      .addCase(loadHomeThunk.fulfilled, (state, action) => {
        state.homeLoading = false;
        state.featured = action.payload.featured;
        state.trending = action.payload.trending;
        state.recommended = action.payload.recommended;
      })
      .addCase(loadHomeThunk.rejected, state => {
        state.homeLoading = false;
      })
      .addCase(loadListThunk.pending, state => {
        state.loading = true;
      })
      .addCase(loadListThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.refresh || action.payload.page === 1) {
          state.list = action.payload.items;
        } else {
          state.list = [...state.list, ...action.payload.items];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(loadListThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? null;
      })
      .addCase(loadSavedThunk.fulfilled, (state, action) => {
        state.saved = action.payload;
      });
  },
});

export const {
  setFilters,
  setLocation,
  clearLocation,
  clearRecentLocations,
  toggleSaved,
  clearList,
} = propertySlice.actions;
export default propertySlice.reducer;
