import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  // Skip auth for certain URLs (like public endpoints)
  if (req.url.includes('/assets/') || req.url.includes('i18n')) {
    return next(req);
  }

  // Get the current user's ID token
  return from(auth.currentUser?.getIdToken() ?? Promise.resolve(null)).pipe(
    switchMap((token) => {
      if (token) {
        // Clone the request and add the Authorization header
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(cloned);
      }
      return next(req);
    })
  );
};
