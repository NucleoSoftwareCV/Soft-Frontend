export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface OneToOneFilterOption {
  id: number;
  name: string;
}

export interface OneToOneServiceCardResponse {
  id: number;
  title: string;
  specialistName: string;
  price: number | null;
  currency: string;
  durationMinutes: number | null;
  imageUrl: string | null;
}

export interface OneToOneServiceDetailResponse {
  id: number;
  specialistId: number;
  specialistName: string;
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  modality: 'ONLINE' | 'PRESENCIAL' | 'AMBAS';
  locationId: number | null;
  locationName: string | null;
  price: number | null;
  currency: string;
  status: 'BORRADOR' | 'PUBLICADO' | 'OCULTO';
  createdAt: string;
  updatedAt: string;
  workTopics: string[];
  techniques: string[];
}

export interface OneToOneServicePageParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  workTopicId?: number | null;
  techniqueId?: number | null;
}

export interface OneToOneServiceRequest {
  title: string;
  description: string;
  imageUrl?: string | null;
  durationMinutes: number;
  modality: 'ONLINE' | 'PRESENCIAL' | 'AMBAS';
  locationId?: number | null;
  price: number;
  currency: string;
  status?: 'BORRADOR' | 'PUBLICADO' | 'OCULTO';
  workTopics: number[];
  techniques: number[];
}
