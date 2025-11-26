import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Reservation, ReservationResponse } from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/api/v1`;

  // Signal to track loading state
  private loadingSignal = signal<boolean>(false);
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get all reservations with optional filters
   */
  getAll(restaurant?: string, date?: string): Observable<ReservationResponse> {
    let params = new HttpParams();
    if (restaurant) params = params.set('restaurant', restaurant);
    if (date) params = params.set('date', date);

    this.loadingSignal.set(true);
    return this.http
      .get<ReservationResponse>(`${this.apiUrl}/reservations`, { params })
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Get reservation by ID
   */
  getById(id: string): Observable<Reservation> {
    this.loadingSignal.set(true);
    return this.http
      .get<Reservation>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Create new reservation
   */
  create(reservation: Reservation): Observable<Reservation> {
    this.loadingSignal.set(true);
    return this.http
      .post<Reservation>(this.apiUrl, reservation)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Update existing reservation
   */
  update(id: string, reservation: Partial<Reservation>): Observable<Reservation> {
    this.loadingSignal.set(true);
    return this.http
      .put<Reservation>(`${this.apiUrl}/${id}`, reservation)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Delete reservation
   */
  delete(id: string): Observable<void> {
    this.loadingSignal.set(true);
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Cancel reservation using token
   */
  cancel(token: string): Observable<{ message: string }> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/cancel/${token}`, {})
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Get reservation by cancellation token
   */
  getByToken(token: string): Observable<Reservation> {
    this.loadingSignal.set(true);
    return this.http
      .get<Reservation>(`${this.apiUrl}/reservations/token/${token}`)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  submitReview(payload: { token: string; rating: number; comment: string }): Observable<any> {
    this.loadingSignal.set(true);
    return this.http
      .post(`${this.apiUrl}/reviews/submit`, payload)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }
}
