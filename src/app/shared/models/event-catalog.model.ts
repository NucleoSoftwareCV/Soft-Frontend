export interface CategoryCatalogItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  active: boolean;
  deletable: boolean;
}

export interface ExperienceTypeCatalogItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  deletable: boolean;
}

export interface CatalogUpsertRequest {
  name: string;
  description: string | null;
  emoji?: string | null;
}
