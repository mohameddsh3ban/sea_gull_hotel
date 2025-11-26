import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RequestHandlerService } from './request-handler.service';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private requestHandler = inject(RequestHandlerService);

  getProfile(): Observable<UserProfile | null> {
    return this.requestHandler.requestBuilder('GET', 'users/profile').execute<UserProfile>();
  }

  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.requestHandler
      .requestBuilder('PUT', 'users/profile')
      .setBody(profile)
      .execute<UserProfile>();
  }
}
