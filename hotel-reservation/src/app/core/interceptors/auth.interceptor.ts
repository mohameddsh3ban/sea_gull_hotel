// =================================================================================
// File: hotel-reservation/src/app/core/interceptors/auth.interceptor.ts
// =================================================================================

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { throwError, from } from 'rxjs';
import { switchMap, catchError, take } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const afAuth = inject(AngularFireAuth);

  // Skip assets, i18n, and external URLs to prevent circular dependency or unnecessary checks
  if (req.url.includes('/assets/') || req.url.includes('i18n')) {
    return next(req);
  }

  // FIX: Use idToken observable (stream) instead of currentUser promise.
  // The Promise method often hangs indefinitely on page reload.
  return afAuth.idToken.pipe(
    take(1), // Take the first value (token or null) and complete immediately
    switchMap((token) => {
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      }
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle Global Auth Errors (401/403)
      if (error.status === 401 || error.status === 403) {
        console.warn('Unauthorized request:', error.url);
      }
      return throwError(() => error);
    })
  );
};
