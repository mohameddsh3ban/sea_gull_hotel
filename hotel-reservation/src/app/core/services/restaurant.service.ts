import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models/restaurant.model';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private apiUrl = `${environment.apiUrl}/api/v1/restaurants`;
  
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Restaurant[]> {
    this.loading.set(true);
    return this.http.get<Restaurant[]>(this.apiUrl).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  getById(id: string): Observable<Restaurant> {
    this.loading.set(true);
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  // New Methods
  create(restaurant: Restaurant): Observable<any> {
    this.loading.set(true);
    return this.http.post(this.apiUrl, restaurant).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  update(id: string, restaurant: Restaurant): Observable<any> {
    this.loading.set(true);
    return this.http.put(`${this.apiUrl}/${id}`, restaurant).pipe(
      finalize(() => this.loading.set(false))
    );
  }

  delete(id: string): Observable<any> {
    this.loading.set(true);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      finalize(() => this.loading.set(false))
    );
  }
}
