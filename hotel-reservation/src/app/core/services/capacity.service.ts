import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CapacityData } from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class CapacityService {
  private apiUrl = `${environment.apiUrl}/api/v1/capacities`;

  private loadingSignal = signal<boolean>(false);
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get all capacities
   */
  getAll(): Observable<CapacityData> {
    this.loadingSignal.set(true);
    return this.http.get<CapacityData>(this.apiUrl).pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Update capacities
   */
  update(capacities: CapacityData): Observable<{ message: string }> {
    this.loadingSignal.set(true);
    return this.http
      .post<{ message: string }>(this.apiUrl, capacities)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }

  /**
   * Get capacity overview
   */
  getOverview(): Observable<any> {
    this.loadingSignal.set(true);
    return this.http
      .get<any>(`${this.apiUrl}/overview`)
      .pipe(tap(() => this.loadingSignal.set(false)));
  }
}
