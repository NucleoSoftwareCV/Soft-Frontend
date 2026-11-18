import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";
import { EarnPointsRequest, RedeemPointsRequest, TransactionsResponse } from "../features/rewards/interfaces/reward-points.interface";

@Injectable({
  providedIn: 'root'
})
export class RewardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rewards`;


  getPointsByUserEmail(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/points`);
  }

  /** Devuelve el dscto q se aplica al precio del evento */
  getRedemptionByPoints(request: RedeemPointsRequest): Observable<Number> {
    return this.http.post<Number>(`${this.apiUrl}/redemption`, request);
  }

  earnPoints(request: EarnPointsRequest): Observable<String> {
    return this.http.post<String>(`${this.apiUrl}/earn`, request);
  }

  redeemPoints(request: RedeemPointsRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/redeem`, request, {responseType: 'text'});
}

  getTransactionsByUserEmail(): Observable<TransactionsResponse[]> {
    return this.http.get<TransactionsResponse[]>(`${this.apiUrl}/transactions`);
  }

}
