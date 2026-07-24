export interface ProfessionalFollowStatusResponse {
  professionalId: number;
  following: boolean;
}

export interface FollowedProfessionalResponse {
  id: number;
  slug: string;
  publicName: string;
  profileCategory: string;
  photoUrl: string | null;
  followedAt: string;
}

export interface FollowedProfessionalPageResponse {
  content: FollowedProfessionalResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
