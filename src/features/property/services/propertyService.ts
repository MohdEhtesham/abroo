import { mockResponse } from '../../../utils/delay';
import { USE_MOCK } from '../../../config/env';
import { apiGet, apiPost } from '../../../services/apiClient';
import {
  MOCK_PROPERTIES,
  getById,
  getFeatured,
  getRecommended,
  getSimilar,
  getTrending,
} from '../mockData/properties';
import type { Property, PropertyFilters } from '../types';

const applyFilters = (list: Property[], filters: PropertyFilters): Property[] => {
  let out = [...list];
  if (filters.city) out = out.filter(p => p.city === filters.city);
  if (filters.types?.length) out = out.filter(p => filters.types!.includes(p.type));
  if (filters.bhk?.length) {
    out = out.filter(p => p.configuration.some(c => filters.bhk!.includes(c)));
  }
  if (filters.budgetMin != null) out = out.filter(p => p.priceMin >= filters.budgetMin!);
  if (filters.budgetMax != null) out = out.filter(p => p.priceMin <= filters.budgetMax!);
  if (filters.possessionStatus?.length) {
    out = out.filter(p => filters.possessionStatus!.includes(p.possessionStatus));
  }
  if (filters.amenities?.length) {
    out = out.filter(p =>
      filters.amenities!.every(aId => p.amenities.some(a => a.id === aId)),
    );
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    out = out.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.builder.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q),
    );
  }
  return out;
};

interface ListResponse {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const mock = {
  list: (filters: PropertyFilters = {}, page = 1, pageSize = 10): Promise<ListResponse> => {
    const filtered = applyFilters(MOCK_PROPERTIES, filters);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return mockResponse(
      { items, total: filtered.length, page, pageSize, hasMore: start + pageSize < filtered.length },
      700,
    );
  },
  detail: (id: string) => mockResponse(getById(id) ?? null, 500),
  featured: () => mockResponse(getFeatured(), 500),
  trending: () => mockResponse(getTrending(), 500),
  recommended: () => mockResponse(getRecommended(), 500),
  similar: (id: string) => mockResponse(getSimilar(id), 400),
  search: (query: string) => mockResponse(applyFilters(MOCK_PROPERTIES, { search: query }), 400),
};

const buildQuery = (filters: PropertyFilters, page: number, pageSize: number) => {
  const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
  if (filters.city) params.city = filters.city;
  if (filters.types?.length) params.types = filters.types.join(',');
  if (filters.bhk?.length) params.bhk = filters.bhk.join(',');
  if (filters.budgetMin != null) params.budgetMin = String(filters.budgetMin);
  if (filters.budgetMax != null) params.budgetMax = String(filters.budgetMax);
  if (filters.possessionStatus?.length) params.possessionStatus = filters.possessionStatus.join(',');
  if (filters.amenities?.length) params.amenities = filters.amenities.join(',');
  if (filters.search) params.search = filters.search;
  return new URLSearchParams(params).toString();
};

const real = {
  list: (filters: PropertyFilters = {}, page = 1, pageSize = 10) =>
    apiGet<ListResponse>(`/properties?${buildQuery(filters, page, pageSize)}`),
  detail: (id: string) => apiGet<Property | null>(`/properties/${id}`),
  featured: () => apiGet<Property[]>('/properties/featured'),
  trending: () => apiGet<Property[]>('/properties/trending'),
  recommended: () => apiGet<Property[]>('/properties/recommended'),
  similar: (id: string) => apiGet<Property[]>(`/properties/${id}/similar`),
  search: (query: string) => apiGet<Property[]>(`/properties/search?q=${encodeURIComponent(query)}`),
  toggleSave: (id: string) => apiPost<{ saved: boolean }>(`/properties/${id}/save`),
  saved: () => apiGet<Property[]>('/properties/saved'),
};

export const propertyService = USE_MOCK ? mock : real;
