export interface ClientInterestCategoryResponse {
  name: string;
}

export interface ClientProfilePreferencesResponse {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  cityId: number;
  cityName: string;
  communicationEmail: string;
  whatsappPhone: string | null;
  receiveSavedEventConfirmations: boolean;
  receivePersonalizedRecommendations: boolean;
  receiveReservationConfirmations: boolean;
  receiveWeeklySummary: boolean;
  interestCategories: ClientInterestCategoryResponse[];
}

export interface ClientProfilePreferencesRequest {
  firstName: string;
  lastName: string;
  cityId: number;
  communicationEmail: string;
  whatsappPhone: string | null;
  receiveSavedEventConfirmations: boolean;
  receivePersonalizedRecommendations: boolean;
  receiveReservationConfirmations: boolean;
  receiveWeeklySummary: boolean;
  categoryIds: number[];
}
