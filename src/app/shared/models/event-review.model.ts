export interface EventReviewerPreview {
  authorName: string;
  avatarUrl: string | null;
}

export interface CreateEventReviewRequest {
  stars: number;
  comment: string | null;
}

export interface EventRatingSummaryResponse {
  eventId: number;
  averageRating: number | null;
  reviewCount: number;
  reviewers?: EventReviewerPreview[];
}

export interface EventReviewEligibilityResponse {
  eventId: number;
  canReview: boolean;
  reason: string | null;
}

export interface EventReviewResponse {
  id: number;
  eventId: number;
  authorName: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}

export interface EventReviewPageResponse {
  content: EventReviewResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
