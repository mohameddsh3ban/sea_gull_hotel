import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RestaurantConfig } from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private apiUrl = `${environment.apiUrl}/api/v1/config`;

  private loadingSignal = signal<boolean>(false);
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get all restaurant configurations
   */
  getAll(): Observable<{ [restaurant: string]: RestaurantConfig }> {
    this.loadingSignal.set(true);
    return this.http
      .get<{ [restaurant: string]: RestaurantConfig }>(this.apiUrl)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Update restaurant configuration
   */
  update(restaurant: string, config: RestaurantConfig): Observable<RestaurantConfig> {
    this.loadingSignal.set(true);
    return this.http
      .put<RestaurantConfig>(`${this.apiUrl}/${restaurant}`, config)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }
}
