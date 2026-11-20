export interface RedeemPointsRequest{
  userId: number;
  eventId: number;
  redeemPoints: number;
}

export interface EarnPointsRequest{
  eventAttendanceId: number;
}

export interface TransactionsResponse{
  id: number;
  type: string;
  pointsQuantity: number;
  balanceAfter: number;
  createdAt: string;
  userEmail: string;
}
