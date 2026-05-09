export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'penthouse' | 'studio';
export type PossessionStatus = 'Ready to Move' | 'Under Construction' | 'New Launch';

export interface Amenity {
  id: string;
  name: string;
  iconName: string;
}

export interface FloorPlan {
  id: string;
  configuration: string;
  area: number;
  price: number;
  imageUrl: string;
}

export interface Builder {
  id: string;
  name: string;
  logo?: string;
  established: number;
  projectsCompleted: number;
  rating: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  builder: string;
  builderInfo: Builder;
  city: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  priceMin: number;
  priceMax: number;
  pricePerSqft: number;
  configuration: string[];
  areaMin: number;
  areaMax: number;
  totalUnits: number;
  totalTowers: number;
  possessionStatus: PossessionStatus;
  possessionDate: string;
  reraId: string;
  images: string[];
  amenities: Amenity[];
  floorPlans: FloorPlan[];
  highlights: string[];
  featured: boolean;
  trending: boolean;
  rating: number;
  reviewCount: number;
}

export interface PropertyFilters {
  city?: string;
  types?: PropertyType[];
  bhk?: string[];
  budgetMin?: number;
  budgetMax?: number;
  possessionStatus?: PossessionStatus[];
  amenities?: string[];
  search?: string;
}
